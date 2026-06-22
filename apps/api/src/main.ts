import "reflect-metadata";

import { Logger, RequestMethod, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { json, urlencoded } from "express";
import express, { type NextFunction, type Request, type Response } from "express";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./core/exceptions/global-exception.filter";
import { RequestLoggingInterceptor } from "./common/interceptors/request-logging.interceptor";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { SocketIoCorsAdapter } from "./events/socket-io.adapter";

// Sentry — init before anything else
import * as Sentry from "@sentry/nestjs";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

async function bootstrap() {
  const rawConfig = { ...process.env };
  const sentryDsn = rawConfig.SENTRY_DSN;

  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: rawConfig.NODE_ENV ?? "development",
      integrations: [nodeProfilingIntegration()],
      tracesSampleRate: rawConfig.NODE_ENV === "production" ? 0.1 : 0.0,
      profilesSampleRate: rawConfig.NODE_ENV === "production" ? 0.1 : undefined,
    });
    Logger.log("Sentry initialized", "Bootstrap");
  }

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.useWebSocketAdapter(new SocketIoCorsAdapter(app, configService));
  const logger = new Logger("Bootstrap");

  const port = configService.getOrThrow<number>("API_PORT");
  const apiPrefix = configService.getOrThrow<string>("API_PREFIX").replace(/^\/+|\/+$/g, "");
  const nodeEnv = configService.getOrThrow<string>("NODE_ENV");

  // Sentry error handler (must be before any other error middleware)
  if (sentryDsn) {
    Sentry.setupExpressErrorHandler(app.getHttpAdapter().getInstance());
  }

  // Security: Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: nodeEnv === "production" ? undefined : false,
    }),
  );

  // Security: CORS
  const corsOrigin = configService.getOrThrow<string>("WEB_ORIGIN");
  app.enableCors({
    origin: corsOrigin.split(",").map((o) => o.trim()),
    credentials: true,
  });

  app.use(cookieParser());

  // Security: CSRF double-submit cookie pattern
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip for non-mutating methods and auth endpoints (have own protection)
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    if (req.path.startsWith("/api/v1/auth/")) return next();

    const cookieToken = req.cookies?.["nexsmsid.csrf"];
    const headerToken = req.headers["x-csrf-token"];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      res.status(403).json({ success: false, message: "Invalid CSRF token" });
      return;
    }

    next();
  });

  // Security: Body Size Limits
  app.use(json({ limit: "10mb" }));
  app.use(urlencoded({ extended: true, limit: "10mb" }));

  const storagePath = configService.get<string>("STORAGE_PATH") ?? "./storage";
  mkdirSync(join(storagePath, "ppdb"), { recursive: true });
  mkdirSync(join(storagePath, "jobs"), { recursive: true });

  const blockedUploadPrefixes = ["ppdb", "jobs", "letters", "reports"];
  const isBlockedUploadPath = (pathname: string) =>
    blockedUploadPrefixes.some((prefix) => pathname === `/${prefix}` || pathname.startsWith(`/${prefix}/`));

  app.use("/uploads", (req: Request, res: Response, next: NextFunction) => {
    const pathname = (req.path ?? req.url ?? "").split("?")[0] ?? "";
    if (isBlockedUploadPath(pathname)) {
      res.status(404).end();
      return;
    }
    express.static(storagePath)(req, res, next);
  });

  app.enableShutdownHooks();
  app.setGlobalPrefix(apiPrefix, {
    exclude: [
      { path: "health", method: RequestMethod.GET },
      { path: "health/detailed", method: RequestMethod.GET },
      { path: `${apiPrefix}/health`, method: RequestMethod.GET },
      { path: `${apiPrefix}/health/detailed`, method: RequestMethod.GET },
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter(configService));

  app.useGlobalInterceptors(new RequestLoggingInterceptor(), new ResponseInterceptor());

  // Swagger exposes the full API surface — never serve it in production
  if (nodeEnv !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("NexSMSID API")
      .setDescription("Enterprise School Management System")
      .setVersion("0.1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document);
  }

  await app.listen(port);

  logger.log(`NexSMSID API [${nodeEnv}] listening on http://localhost:${port}`);
  logger.log(`API prefix enabled at /${apiPrefix}`);
  logger.log(`CORS allowed for: ${corsOrigin}`);
}

// Global process-level error handlers (last resort — beyond NestJS exception filter scope)
process.on("unhandledRejection", (reason: unknown) => {
  Logger.error(`UNHANDLED REJECTION: ${reason instanceof Error ? reason.message : String(reason)}`, "Process");
});

process.on("uncaughtException", (error: Error) => {
  Logger.error(`UNCAUGHT EXCEPTION: ${error.message}`, error.stack, "Process");
  // Give logger time to flush, then exit hard
  setTimeout(() => process.exit(1), 1000).unref();
});

void bootstrap();

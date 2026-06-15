import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { ParseCuidPipe } from "../common/pipes/parse-cuid.pipe";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes } from "@nestjs/swagger";

import { z } from "zod";

import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { ppdbDocumentFileInterceptorOptions } from "../common/upload";
import { AuthenticatedUser, getRequestMeta, RequestWithUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../auth/guards/permission.guard";
import { apiSuccess } from "../common/api-response";
import { CaptchaService } from "../common/captcha/captcha.service";
import { createJobVacancySchema, updateJobVacancySchema } from "./job-vacancies.dto";
import { JobVacanciesService } from "./job-vacancies.service";
import { publicJobApplyBodySchema, publicJobCvTokenBodySchema, publicJobCvUploadBodySchema } from "./public-jobs.dto";

@Controller("job-vacancies")
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags("Job Vacancies")
@ApiBearerAuth()
export class JobVacanciesController {
  constructor(@Inject(JobVacanciesService) private readonly service: JobVacanciesService) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Job Vacancies list" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  @RequirePermissions("job-vacancies.view")
  async list(@Query() query: unknown) {
    const result = await this.service.list(query);
    return apiSuccess("Job vacancies retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Create" })
  @ApiResponse({ status: 200, description: "Job Vacancies create" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @RequirePermissions("job-vacancies.create")
  async create(
    @Body(new ZodValidationPipe(createJobVacancySchema.strict())) body: z.infer<typeof createJobVacancySchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Job vacancy created", await this.service.create(body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Job Vacancies find by id" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get(":id")
  @RequirePermissions("job-vacancies.view")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Job vacancy retrieved", await this.service.findById(id));
  }

  @ApiOperation({ summary: "Update" })
  @ApiResponse({ status: 200, description: "Job Vacancies update" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Patch(":id")
  @RequirePermissions("job-vacancies.update")
  async update(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(updateJobVacancySchema.strict())) body: z.infer<typeof updateJobVacancySchema>,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithUser,
  ) {
    return apiSuccess("Job vacancy updated", await this.service.update(id, body, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Delete" })
  @ApiResponse({ status: 200, description: "Job Vacancies delete" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Delete(":id")
  @RequirePermissions("job-vacancies.delete")
  async delete(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Job vacancy deleted", await this.service.delete(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Publish" })
  @ApiResponse({ status: 200, description: "Job Vacancies publish" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/publish")
  @RequirePermissions("job-vacancies.publish")
  async publish(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Job vacancy published", await this.service.publish(id, user, getRequestMeta(request)));
  }

  @ApiOperation({ summary: "Close" })
  @ApiResponse({ status: 200, description: "Job Vacancies close" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post(":id/close")
  @RequirePermissions("job-vacancies.close")
  async close(@Param("id", ParseCuidPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithUser) {
    return apiSuccess("Job vacancy closed", await this.service.close(id, user, getRequestMeta(request)));
  }
}

@Controller("public/jobs")
@UseGuards(JwtAuthGuard, PermissionGuard)
@Public()
@ApiTags("Job Vacancies")
@ApiBearerAuth()
export class PublicJobsController {
  constructor(
    @Inject(JobVacanciesService) private readonly service: JobVacanciesService,
    @Inject(CaptchaService) private readonly captchaService: CaptchaService,
  ) {}

  @ApiOperation({ summary: "List" })
  @ApiResponse({ status: 200, description: "Job Vacancies list" })
  @Get()
  async list(@Query() query: unknown) {
    const result = await this.service.publicList(query);
    return apiSuccess("Public jobs retrieved", result.items, { page: result.page, limit: result.limit, total: result.total });
  }

  @ApiOperation({ summary: "Find By Id" })
  @ApiResponse({ status: 200, description: "Job Vacancies find by id" })
  @Get(":id")
  async findById(@Param("id", ParseCuidPipe) id: string) {
    return apiSuccess("Public job retrieved", await this.service.publicFindById(id));
  }

  @ApiOperation({ summary: "Issue CV upload token for a published job" })
  @Post(":id/upload-cv-token")
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  async issueCvUploadToken(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(publicJobCvTokenBodySchema.strict())) body: z.infer<typeof publicJobCvTokenBodySchema>,
  ) {
    await this.captchaService.verify(body.captchaToken);
    return apiSuccess("CV upload token issued", await this.service.issueCvUploadToken(id));
  }

  @ApiOperation({ summary: "Upload job application CV" })
  @ApiConsumes("multipart/form-data")
  @Post("upload-cv")
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor("file", ppdbDocumentFileInterceptorOptions))
  async uploadCv(
    @UploadedFile() file: Express.Multer.File,
    @Body(new ZodValidationPipe(publicJobCvUploadBodySchema.strict())) body: z.infer<typeof publicJobCvUploadBodySchema>,
  ) {
    await this.captchaService.verify(body.captchaToken);
    return apiSuccess("CV uploaded", await this.service.saveUploadedCv(file, body.uploadToken));
  }

  @ApiOperation({ summary: "Apply" })
  @ApiResponse({ status: 200, description: "Job Vacancies apply" })
  @ApiResponse({ status: 429, description: "Too many requests — rate limited" })
  @Post(":id/apply")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async apply(
    @Param("id", ParseCuidPipe) id: string,
    @Body(new ZodValidationPipe(publicJobApplyBodySchema.strict())) body: z.infer<typeof publicJobApplyBodySchema>,
  ) {
    await this.captchaService.verify(body.captchaToken);
    const { captchaToken: _captcha, ...payload } = body;
    return apiSuccess("Job application submitted", await this.service.publicApply(id, payload));
  }
}

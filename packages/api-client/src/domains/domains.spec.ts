import { describe, it, expect, vi } from "vitest";
import { createAuthApi } from "./auth";
import { createAcademicApi } from "./academic";
import { createBkkApi } from "./bkk";
import { createCommunicationApi } from "./communication";
import { createCounselingDisciplineApi } from "./counseling-discipline";
import { createExamsApi } from "./exams";
import { createFinanceApi } from "./finance";
import { createHrPayrollApi } from "./hr-payroll";
import { createInventoryApi } from "./inventory";
import { createLettersApi } from "./letters";
import { createLibraryApi } from "./library";
import { createMasterDataApi } from "./master-data";
import { createPeopleApi } from "./people";
import { createPpdbApi } from "./ppdb";
import { createPublicApi } from "./public";
import { createReportsApi } from "./reports";
import { createSchoolApi } from "./school";
import { createUsersApi } from "./users";

function createMockCore(data: unknown) {
  return { request: vi.fn().mockResolvedValue({ ok: true, data }) };
}

describe("api-client domains", () => {
  describe("auth", () => {
    it("should call login and return session", async () => {
      const core = createMockCore({ accessToken: "at", refreshToken: "rt" });
      const api = createAuthApi(core);
      const result = await api.login({ email: "a@b.com", password: "p" });
      expect(core.request).toHaveBeenCalledWith("/auth/login", expect.objectContaining({ method: "POST" }));
      expect(result).toHaveProperty("accessToken");
    });

    it("should call me and return user", async () => {
      const core = createMockCore({ id: "1", name: "T" });
      const api = createAuthApi(core);
      const result = await api.me();
      expect(core.request).toHaveBeenCalledWith("/auth/me", expect.any(Object));
      expect(result).toHaveProperty("id");
    });
  });

  describe("academic", () => {
    it("should create api with request method", () => {
      const core = createMockCore([]);
      const api = createAcademicApi(core);
      expect(api).toHaveProperty("getClassrooms");
    });
  });

  describe("bkk", () => {
    it("should create api with request method", () => {
      const core = createMockCore([]);
      const api = createBkkApi(core);
      expect(api).toHaveProperty("getJobVacancies");
    });
  });

  describe("communication", () => {
    it("should create api with request method", () => {
      const core = createMockCore([]);
      const api = createCommunicationApi(core);
      expect(api).toHaveProperty("getAnnouncements");
    });

    it("should call createAnnouncement", async () => {
      const core = createMockCore({ id: "1" });
      const api = createCommunicationApi(core);
      const result = await api.createAnnouncement({ title: "Test", audience: "ALL", body: "Hello" });
      expect(core.request).toHaveBeenCalled();
      expect(result).toHaveProperty("id");
    });
  });

  describe("counseling-discipline", () => {
    it("should create api with getDisciplineViolations", () => {
      const core = createMockCore([]);
      const api = createCounselingDisciplineApi(core);
      expect(api).toHaveProperty("getDisciplineViolations");
    });
  });

  describe("exams", () => {
    it("should create api with getExams", () => {
      const core = createMockCore([]);
      const api = createExamsApi(core);
      expect(api).toHaveProperty("getExams");
    });
  });

  describe("finance", () => {
    it("should create api with getInvoices", () => {
      const core = createMockCore([]);
      const api = createFinanceApi(core);
      expect(api).toHaveProperty("getInvoices");
    });
  });

  describe("hr-payroll", () => {
    it("should create api with getEmployees", () => {
      const core = createMockCore([]);
      const api = createHrPayrollApi(core);
      expect(api).toHaveProperty("getEmployees");
    });
  });

  describe("inventory", () => {
    it("should create api with getItems", () => {
      const core = createMockCore([]);
      const api = createInventoryApi(core);
      expect(api).toHaveProperty("getItems");
    });
  });

  describe("letters", () => {
    it("should create api with getLetters", () => {
      const core = createMockCore([]);
      const api = createLettersApi(core);
      expect(api).toHaveProperty("getLetters");
    });
  });

  describe("library", () => {
    it("should create api with getBooks", () => {
      const core = createMockCore([]);
      const api = createLibraryApi(core);
      expect(api).toHaveProperty("getBooks");
    });
  });

  describe("master-data", () => {
    it("should create api with getAcademicYears", () => {
      const core = createMockCore([]);
      const api = createMasterDataApi(core);
      expect(api).toHaveProperty("getAcademicYears");
    });
  });

  describe("people", () => {
    it("should create api with getStudents", () => {
      const core = createMockCore([]);
      const api = createPeopleApi(core);
      expect(api).toHaveProperty("getStudents");
    });
  });

  describe("ppdb", () => {
    it("should create api with getPeriods", () => {
      const core = createMockCore([]);
      const api = createPpdbApi(core);
      expect(api).toHaveProperty("getPeriods");
    });
  });

  describe("public", () => {
    it("should create api with getJobs", () => {
      const core = createMockCore([]);
      const api = createPublicApi(core);
      expect(api).toHaveProperty("getJobs");
    });
  });

  describe("reports", () => {
    it("should create api with getReports", () => {
      const core = createMockCore([]);
      const api = createReportsApi(core);
      expect(api).toHaveProperty("getReports");
    });
  });

  describe("school", () => {
    it("should create api with getProfile", () => {
      const core = createMockCore([]);
      const api = createSchoolApi(core);
      expect(api).toHaveProperty("getProfile");
    });
  });

  describe("users", () => {
    it("should create api with getUsers", () => {
      const core = createMockCore([]);
      const api = createUsersApi(core);
      expect(api).toHaveProperty("getUsers");
    });
  });
});

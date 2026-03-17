-- AlterEnum
ALTER TYPE "JobStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "analysisData" JSONB;

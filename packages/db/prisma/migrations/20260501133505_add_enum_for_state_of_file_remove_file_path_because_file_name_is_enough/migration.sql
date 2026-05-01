/*
  Warnings:

  - You are about to drop the column `filePath` on the `File` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('UPLOADED', 'PROCESSED', 'PROCESSING', 'ERROR');

-- AlterTable
ALTER TABLE "File" DROP COLUMN "filePath",
ADD COLUMN     "status" "FileStatus" NOT NULL DEFAULT 'UPLOADED';

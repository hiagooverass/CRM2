/*
  Warnings:

  - Added the required column `updatedAt` to the `document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `log` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `document` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `log` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

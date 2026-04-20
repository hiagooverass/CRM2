-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'USER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Client` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `document` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `birthDate` DATETIME(3) NULL,
    `tradingName` VARCHAR(191) NULL,
    `legalNature` VARCHAR(191) NULL,
    `foundationDate` DATETIME(3) NULL,
    `score` INTEGER NOT NULL DEFAULT 0,
    `classification` VARCHAR(191) NOT NULL DEFAULT 'BAIXO',
    `scoreReasons` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Client_document_key`(`document`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contract` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `value` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Billing` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `contractId` VARCHAR(191) NULL,
    `amount` DOUBLE NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `paidDate` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Document` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Log` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `details` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Contract` ADD CONSTRAINT `Contract_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Billing` ADD CONSTRAINT `Billing_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Billing` ADD CONSTRAINT `Billing_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `Contract`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Document` ADD CONSTRAINT `Document_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Log` ADD CONSTRAINT `Log_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

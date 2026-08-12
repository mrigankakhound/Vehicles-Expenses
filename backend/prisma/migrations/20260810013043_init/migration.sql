-- CreateEnum
CREATE TYPE "VehicleCategory" AS ENUM ('TWO_WHEELER', 'FOUR_WHEELER');

-- CreateEnum
CREATE TYPE "VehicleSubCategory" AS ENUM ('HATCHBACK', 'SEDAN', 'SUV', 'COMPACT_SUV', 'MOTORCYCLE_ABOVE_200CC', 'SCOOTY_ABOVE_125CC', 'MOTORCYCLE_BELOW_200CC', 'MUV', 'SCOOTY_BELOW_110CC');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('WASHING', 'FUEL', 'VEHICLE_SERVICE', 'OFFICE');

-- CreateEnum
CREATE TYPE "WashingServiceType" AS ENUM ('BODY_WASH', 'INTERIOR_CLEANING', 'EXTERIOR_CLEANING', 'VACUUM_CLEANING', 'POLISHING', 'WAXING', 'FULL_CLEANING', 'DETAILING', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceExpenseType" AS ENUM ('RENT_SHARE', 'SERVICE', 'PURCHASE', 'TOLL_GATE', 'EMI', 'PAINT', 'TOWING_CHARGE', 'PUC', 'INSURANCE', 'GPS', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('SBI', 'CASH', 'UPI', 'NA');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'UNPAID');

-- CreateEnum
CREATE TYPE "PartyType" AS ENUM ('FUEL_STATION', 'WASHING_CENTER', 'SERVICE_CENTER', 'SUPPLIER', 'OFFICE_VENDOR', 'OTHER');

-- CreateEnum
CREATE TYPE "PartyStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "vehicleCategory" "VehicleCategory" NOT NULL,
    "subCategory" "VehicleSubCategory" NOT NULL,
    "modelName" TEXT NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PartyType" NOT NULL,
    "status" "PartyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "expenseType" "ExpenseType" NOT NULL,
    "date" DATE NOT NULL,
    "vehicleId" TEXT,
    "partyId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL,
    "serviceType" "WashingServiceType",
    "serviceExpenseType" "ServiceExpenseType",
    "expenseDescription" TEXT,
    "note" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_revenues" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "revenueAmount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_revenues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vehicleNumber_key" ON "vehicles"("vehicleNumber");

-- CreateIndex
CREATE INDEX "vehicles_vehicleNumber_idx" ON "vehicles"("vehicleNumber");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicles_vehicleCategory_idx" ON "vehicles"("vehicleCategory");

-- CreateIndex
CREATE INDEX "vehicles_subCategory_idx" ON "vehicles"("subCategory");

-- CreateIndex
CREATE INDEX "parties_status_idx" ON "parties"("status");

-- CreateIndex
CREATE INDEX "parties_type_idx" ON "parties"("type");

-- CreateIndex
CREATE INDEX "expenses_date_idx" ON "expenses"("date");

-- CreateIndex
CREATE INDEX "expenses_vehicleId_idx" ON "expenses"("vehicleId");

-- CreateIndex
CREATE INDEX "expenses_expenseType_idx" ON "expenses"("expenseType");

-- CreateIndex
CREATE INDEX "expenses_paymentStatus_idx" ON "expenses"("paymentStatus");

-- CreateIndex
CREATE INDEX "expenses_paymentMethod_idx" ON "expenses"("paymentMethod");

-- CreateIndex
CREATE INDEX "expenses_partyId_idx" ON "expenses"("partyId");

-- CreateIndex
CREATE INDEX "expenses_isDeleted_idx" ON "expenses"("isDeleted");

-- CreateIndex
CREATE INDEX "expenses_date_vehicleId_idx" ON "expenses"("date", "vehicleId");

-- CreateIndex
CREATE INDEX "expenses_date_expenseType_idx" ON "expenses"("date", "expenseType");

-- CreateIndex
CREATE INDEX "vehicle_revenues_vehicleId_idx" ON "vehicle_revenues"("vehicleId");

-- CreateIndex
CREATE INDEX "vehicle_revenues_year_idx" ON "vehicle_revenues"("year");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_revenues_vehicleId_year_key" ON "vehicle_revenues"("vehicleId", "year");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_revenues" ADD CONSTRAINT "vehicle_revenues_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

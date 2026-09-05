-- CreateEnum
CREATE TYPE "Role" AS ENUM ('VOLUNTEER', 'ORGANIZER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('SHELTER', 'ELDERLY', 'PSO', 'URBAN');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DONE');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('OPEN', 'CLOSED', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VOLUNTEER',
    "phone" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "skills" TEXT[],
    "interests" "Category"[],
    "availability" TEXT[],
    "totalHours" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "category" "Category"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "slots" INTEGER NOT NULL DEFAULT 1,
    "filledSlots" INTEGER NOT NULL DEFAULT 0,
    "requirements" TEXT[],
    "status" "OpportunityStatus" NOT NULL DEFAULT 'OPEN',
    "contactInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizerId" TEXT NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "hoursLogged" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "NewsPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerProfile_userId_key" ON "VolunteerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationProfile_userId_key" ON "OrganizationProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_opportunityId_volunteerId_key" ON "Application"("opportunityId", "volunteerId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsPost_slug_key" ON "NewsPost"("slug");

-- AddForeignKey
ALTER TABLE "VolunteerProfile" ADD CONSTRAINT "VolunteerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationProfile" ADD CONSTRAINT "OrganizationProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "OrganizationProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "VolunteerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsPost" ADD CONSTRAINT "NewsPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

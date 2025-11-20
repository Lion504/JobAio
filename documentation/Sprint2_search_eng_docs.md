# Sprint 2 -- Job Search API Documentation

## 1. Overview

This sprint implements a **Job Search API** that: - Stores job posts in
MongoDB using Mongoose\
- Provides a **search adapter** for querying jobs by different fields\
- Exposes REST endpoints via Express to: - Get all jobs - Search jobs by
title - Search jobs by company - Search jobs by location

------------------------------------------------------------------------

## 2. Data Model

### Job Model (jobModel.js)

    title: String
    link: String
    company: String
    location: String
    description: String
    createdAt: Date
    updatedAt: Date

The schema uses `timestamps: true`, so `createdAt` and `updatedAt` are
automatically added.

------------------------------------------------------------------------

## 3. Search Adapter (adapter.js)

### findJobsByField(field, value)

Performs a **case‑insensitive partial match** search using MongoDB
RegExp.

### findAllJobs()

Returns all jobs sorted by newest first.

------------------------------------------------------------------------

## 4. Controllers (jobController.js)

### getAllJobs

-   **Method:** GET\
-   **Route:** `/api/jobs`\
-   Returns all jobs.

### getJobByTitle

-   **Method:** GET\
-   **Route:** `/api/jobs/title/:jobTitle`\
-   Searches jobs by title.

### getJobByCompany

-   **Method:** GET\
-   **Route:** `/api/jobs/company/:jobCompany`\
-   Searches jobs by company.

### getJobByLocation

-   **Method:** GET\
-   **Route:** `/api/jobs/location/:jobLocation`\
-   Searches jobs by location.

Each controller includes: - Input validation\
- 400 response on invalid input\
- 404 response if no results

------------------------------------------------------------------------

## 5. Routes (jobRoutes.js)

    GET /
    GET /title/:jobTitle
    GET /company/:jobCompany
    GET /location/:jobLocation

------------------------------------------------------------------------

## 6. Example API Requests

### Get all jobs:

    GET /api/jobs

### Search by title:

    GET /api/jobs/title/developer

### Search by company:

    GET /api/jobs/company/google

### Search by location:

    GET /api/jobs/location/helsinki

------------------------------------------------------------------------

## 7. How the System Works

1.  **Routes** forward requests\
2.  **Controllers** validate + call adapter\
3.  **Adapter** queries MongoDB\
4.  **Model** defines job structure




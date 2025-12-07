# JOBAio API Documentation
---

## 1. Data Model: `OriginalJob`

`OriginalJob` represents a single job entry used in POST (create), PUT (update), and returned in GET responses.

### Fields (bullet list)
- **title** (string)
  - Description: Job title.
  - Indexing: B-Tree + Text (weight 10)
  - Search/Filter key: `term`
- **company** (string)
  - Description: Company name.
  - Indexing: B-Tree + Text (weight 4)
  - Search/Filter key: `company`
- **location** (string)
  - Description: Geographical location.
  - Indexing: B-Tree
  - Search/Filter key: `location`
- **publish_date** (string)
  - Description: Date job was posted at the source.
  - Indexing: B-Tree
- **description** (string)
  - Description: Detailed job description.
  - Indexing: Text (weight 1)
  - Search/Filter key: `term`
- **experience_level** (string)
  - Description: e.g., 'senior', 'junior', 'entry'
  - Indexing: B-Tree + Text (weight 1)
  - Search/Filter key: `experience_level`
- **industry_category** (string)
  - Description: e.g., 'Technology', 'Finance'
  - Indexing: B-Tree + Text (weight 4)
  - Search/Filter key: `industry_category`
- **job_type** (array[string])
  - Description: e.g., ['full-time', 'remote']
  - Indexing: B-Tree + Text (weight 3)
  - Search/Filter key: `job_type`
- **language.required** (array[string])
  - Description: Required languages (e.g., ['Finnish','English'])
  - Indexing: B-Tree + Text (weight 5)
  - Search/Filter key: `required_language`
- **skill_type.technical** (array[string])
  - Description: Technical skills (e.g., ['Java','Angular'])
  - Indexing: Text (weight 5)
  - Search/Filter key: `term`
- **_metadata** (object)
  - Description: Internal processing metadata.
- **createdAt** (Date)
  - Description: Automatic creation timestamp.
  - Indexing: TTL index (14 days) — used for automatic cleanup and sorting.
- **score** (number) — output only
  - Description: Text-search relevance score (returned by search endpoints).

---

## 2. Endpoints

### A) Ranked Search & Filtering
**GET** `/api/jobs/search`
Performs weighted full-text ranking plus optional contextual filters. Supports filter-only requests (no `term`).

**Query parameters (use any combination):**
- `term` — e.g., `Java Developer` (optional)
  - Weighted term search (title > skills > description by weight)
- `location` — e.g., `Helsinki` (optional)
- `experience_level` — e.g., `senior` (optional)
- `required_language` — e.g., `Finnish` (optional) — maps to `language.required`
- `company` — e.g., `Twoday Oy` (optional)
- `industry_category` — e.g., `Technology` (optional)
- `job_type` — e.g., `full-time` (optional)

**Responses:**
- `200 OK` — Returns an array of matching job objects (ranked when `term` is used).
- `400 Bad Request` — Returned if **no** `term` **and** no filters are provided.
- `404 Not Found` — No jobs matched the criteria.

---

### B) Data Creation & Management

- **POST** `/api/jobs`
  - Description: Insert a single `OriginalJob` object.
  - Body: single `OriginalJob`
  - Response: `201 Created`

- **POST** `/api/jobs/bulk`
  - Description: Bulk insert multiple jobs safely.
  - Body: array of `OriginalJob` objects
  - Response: `201 Created` (returns `insertedCount` and an `errors` array)

- **PUT** `/api/jobs/:id`
  - Description: Update an existing job by MongoDB `_id`.
  - Body: Partial `OriginalJob` (only fields to update)
  - Response: `200 OK`

---

### C) General Listing

- **GET** `/api/jobs`
  - Description: Retrieves all jobs. If `search` or `q` is provided, performs a basic ranked search.
  - Query params: `search` or `q` (optional)
  - Response: `200 OK` — Array of jobs or search results.

---

## 3. Notes & Tips
- Use `term` for relevance-ranking (title has highest weight).
- You can perform filter-only queries (e.g., `?location=Helsinki&job_type=remote`) — `term` is optional.
- `createdAt` uses a TTL index for auto-deletion after 14 days — useful for ephemeral postings.
- `score` is returned only for search results to indicate relevance.

---

## 4. Example Requests

**Search for Java roles in Helsinki**
```
GET /api/jobs/search?term=Java&location=Helsinki
```

**Insert a job**
```
POST /api/jobs
Content-Type: application/json

{
  "title": "Senior Java Developer",
  "company": "Acme Oy",
  "location": "Helsinki",
  "publish_date": "2025-12-01",
  "description": "Backend services, microservices...",
  "experience_level": "senior",
  "industry_category": "Technology",
  "job_type": ["full-time"],
  "language": { "required": ["English", "Finnish"] },
  "skill_type": { "technical": ["Java", "Spring"] }
}
```



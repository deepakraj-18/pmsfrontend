# Destination Frontend: React Integration & Setup Plan

This folder contains the destination single-page application (SPA) client for the Project Management System (PMS). It is set up to point to the migrated backend, facilitating the switch from MySQL+FastAPI to MS SQL Server + ASP.NET Core.

---

## 1. Technology Configuration

* **Vite Dev Server**: Runs on `http://localhost:5173`.
* **Deployment Config**: Includes `staticwebapp.config.json` for hosting on Azure Static Web Apps.
* **Styling Integrations**: Merges PrimeReact elements with Tailwind CSS v4 styling rules.

---

## 2. Integration Mapping & Migration Steps

To connect this React client to the new .NET API backend, the following modifications and checks are required:

### 2.1 API Endpoint Base Configuration
Modify the `.env` file in the root of `pmsfrontend`:
```env
VITE_API_URL=http://localhost:5000/api/v1
```
Make sure this aligns with the port that the ASP.NET Core API launches on (typically `http://localhost:5000` or `https://localhost:5001`).

### 2.2 JSON Field Naming Conventions
* **FastAPI Behavior**: Returns properties in `snake_case` (e.g. `first_name`, `project_group_id`).
* **ASP.NET Core Default**: Serializes object properties in `camelCase` (e.g. `firstName`, `projectGroupId`).
* **Conversion Options**:
  1. **Configure .NET Serializer (Recommended)**: Instruct ASP.NET Core to serialize JSON using snake_case to match the existing frontend codebase without altering thousands of React lines of code. This is configured in the backend's `Program.cs` under Controller settings.
  2. **Manual Frontend Translation**: Update TypeScript interfaces and state attributes in the frontend to camelCase.

### 2.3 Authentication Token Interception
Ensure the Axios interceptor in `src/api/` matches the JWT token structure returned by Azure AD:
* Verify the MSAL configuration values (`tenantId`, `clientId`, `redirectUri`) in `src/auth/authConfig.ts` match the Azure AD app registration of the destination environment.
* The access token requested by the `@azure/msal-react` provider must request the backend API client ID scope (e.g., `api://<dotnet-api-client-id>/access_as_user`).

---

## 3. Deployment and Running Locally

To run the destination frontend locally:

```bash
# 1. Install packages
npm install

# 2. Start development server
npm run dev
```

The app will compile and become available on `http://localhost:5173`.

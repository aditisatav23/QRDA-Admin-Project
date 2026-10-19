"""
QRDA Enterprise Integration SDK & Data Service (Python)
------------------------------------------------------
This module provides complete integration capabilities for the QRDA Admin Portal:
1. Employee Directory (fetch, filter, add, update, onboarded list)
2. Standard Deployment Details (site requirements, onboarded count, shortfall/surplus calculations, daily deployment counts)
3. Third-party Project Integration (REST client, JSON sync, CSV export, standalone mock runner)

Author: Antigravity AI
Version: 1.0.0
"""

import json
import os
import urllib.request
import urllib.parse
import urllib.error
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict


# ─── DATA MODELS ───────────────────────────────────────────────────────────────

@dataclass
class Employee:
    oid: str
    empCode: str
    name: str
    client: str
    branch: str
    site: str
    skillDesig: str
    clientDesig: str
    email: str
    mobile: str
    weeklyOff: str
    joinedOn: str
    releavedOn: str
    onBoard: bool
    attnApp: bool = True
    traineeApp: bool = False

    def to_dict( me ) -> Dict[str, Any]:
        return asdict(me)


@dataclass
class DeploymentRow:
    designation: str
    required: int
    onboard: int
    shortfall: int
    monFri: int
    sat: int
    sun: int

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class SiteDeploymentSummary:
    client: str
    branch: str
    site: str
    rows: List[DeploymentRow]
    total_required: int
    total_onboard: int
    total_shortfall: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "client": self.client,
            "branch": self.branch,
            "site": self.site,
            "rows": [r.to_dict() for r in self.rows],
            "total_required": self.total_required,
            "total_onboard": self.total_onboard,
            "total_shortfall": self.total_shortfall,
        }


# ─── FALLBACK / DEFAULT DATASET ────────────────────────────────────────────────

DEFAULT_EMPLOYEES = [
    {
        "oid": "112",
        "empCode": "68448",
        "name": "Dinesh Jagtap",
        "client": "Tata Communications",
        "branch": "Mumbai",
        "site": "TCL BKC",
        "skillDesig": "S/SUP",
        "clientDesig": "S/SUP",
        "email": "dinesh.jagtap@tatacomm.com",
        "mobile": "9874561221",
        "weeklyOff": "SAT",
        "joinedOn": "19-Apr-1997",
        "releavedOn": "30-Jun-2023",
        "onBoard": False,
    },
    {
        "oid": "113",
        "empCode": "67828",
        "name": "Sandeep Utekar",
        "client": "Tata Communications",
        "branch": "Mumbai",
        "site": "TCL VSB",
        "skillDesig": "S/SUP",
        "clientDesig": "S/SUP",
        "email": "sandeep.utekar@tatacomm.com",
        "mobile": "9152654401",
        "weeklyOff": "SUN",
        "joinedOn": "19-Apr-1997",
        "releavedOn": "",
        "onBoard": True,
    },
    {
        "oid": "114",
        "empCode": "68351",
        "name": "Amardeep Gawhande",
        "client": "Tata Communications",
        "branch": "Mumbai",
        "site": "TCL BKC",
        "skillDesig": "S/G",
        "clientDesig": "S/G",
        "email": "amardeep.g@tatacomm.com",
        "mobile": "8369597035",
        "weeklyOff": "SAT",
        "joinedOn": "19-Apr-1997",
        "releavedOn": "",
        "onBoard": True,
    },
    {
        "oid": "121",
        "empCode": "70112",
        "name": "Vikas Sharma",
        "client": "Wipro",
        "branch": "Pune",
        "site": "WIPRO PDC - II",
        "skillDesig": "ASM",
        "clientDesig": "ASM",
        "email": "vikas.sharma@wipro.com",
        "mobile": "9822011445",
        "weeklyOff": "SUN",
        "joinedOn": "01-Jan-2015",
        "releavedOn": "",
        "onBoard": True,
    },
    {
        "oid": "122",
        "empCode": "70245",
        "name": "Mahesh Kadam",
        "client": "Wipro",
        "branch": "Pune",
        "site": "WIPRO PDC - II",
        "skillDesig": "S/G",
        "clientDesig": "S/G",
        "email": "mahesh.kadam@wipro.com",
        "mobile": "9765432109",
        "weeklyOff": "SUN",
        "joinedOn": "12-Mar-2018",
        "releavedOn": "",
        "onBoard": True,
    },
]

DEFAULT_REQUIREMENTS = {
    "Wipro|Pune|WIPRO PDC - II": [
        {"designation": "ASM", "required": 1, "monFri": 1, "sat": 1, "sun": 0},
        {"designation": "S/G", "required": 131, "monFri": 116, "sat": 40, "sun": 76},
        {"designation": "S/SUP", "required": 5, "monFri": 3, "sat": 3, "sun": 3},
        {"designation": "S/OFF", "required": 4, "monFri": 3, "sat": 2, "sun": 2},
        {"designation": "RELIEVE", "required": 0, "monFri": 0, "sat": 0, "sun": 0},
    ],
    "Tata Communications|Mumbai|TCL BKC": [
        {"designation": "ASM", "required": 2, "monFri": 2, "sat": 1, "sun": 1},
        {"designation": "S/G", "required": 45, "monFri": 40, "sat": 20, "sun": 15},
        {"designation": "S/SUP", "required": 4, "monFri": 3, "sat": 2, "sun": 2},
        {"designation": "L/SG", "required": 12, "monFri": 8, "sat": 4, "sun": 4},
        {"designation": "RELIEVE", "required": 0, "monFri": 0, "sat": 0, "sun": 0},
    ],
}


# ─── SERVICE LAYER ─────────────────────────────────────────────────────────────

class QRDAService:
    """
    Core integration service for managing Employee Directory & Standard Deployment Details.
    Communicates with QRDA FastAPI backend (http://localhost:8001) or operates standalone.
    """

    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.getenv("QRDA_API_BASE_URL", "http://localhost:8001")
        self._local_employees: List[Dict[str, Any]] = list(DEFAULT_EMPLOYEES)

    def _http_get(self, endpoint: str) -> Optional[Any]:
        url = f"{self.base_url}{endpoint}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "QRDA-Python-SDK/1.0"})
            with urllib.request.urlopen(req, timeout=3) as resp:
                if resp.status == 200:
                    return json.loads(resp.read().decode("utf-8"))
        except Exception:
            pass  # Fallback to local memory store if backend unavailable
        return None

    def _http_post(self, endpoint: str, data: Dict[str, Any]) -> Optional[Any]:
        url = f"{self.base_url}{endpoint}"
        try:
            payload = json.dumps(data).encode("utf-8")
            req = urllib.request.Request(
                url, data=payload, headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=3) as resp:
                if resp.status in (200, 201):
                    return json.loads(resp.read().decode("utf-8"))
        except Exception:
            pass
        return None

    # ── 1. EMPLOYEE DIRECTORY API ──────────────────────────────────────────────

    def get_employees(
        self,
        client: str = None,
        branch: str = None,
        site: str = None,
        onboard_only: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        Fetch all employees filtered by Client, Branch, Site, or Onboard status.
        """
        remote_data = self._http_get("/api/reports/employee-list")
        if remote_data and isinstance(remote_data, dict) and "items" in remote_data:
            records = remote_data["items"]
        else:
            records = self._local_employees

        filtered = []
        for emp in records:
            # Normalize fields
            emp_client = emp.get("client") or emp.get("client_name") or ""
            emp_branch = emp.get("branch") or "Mumbai"
            emp_site = emp.get("site") or ""
            is_onboard = emp.get("onBoard") if "onBoard" in emp else (emp.get("on_board", True))

            if client and client.lower() not in emp_client.lower():
                continue
            if branch and branch.lower() not in emp_branch.lower():
                continue
            if site and site.lower() not in emp_site.lower():
                continue
            if onboard_only and not is_onboard:
                continue

            filtered.append(emp)

        return filtered

    def get_onboarded_employees(self) -> List[Dict[str, Any]]:
        """Get only active / onboarded employees."""
        return self.get_employees(onboard_only=True)

    def add_employee(self, employee_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add a new employee to the directory.
        """
        remote_res = self._http_post("/users/", employee_data)
        if remote_res:
            return remote_res

        # Local fallback state modification
        new_id = str(len(self._local_employees) + 112)
        new_emp = {
            "oid": new_id,
            "empCode": employee_data.get("empCode", f"EMP{new_id}"),
            "name": employee_data.get("name", "New Employee"),
            "client": employee_data.get("client", "Tata Communications"),
            "branch": employee_data.get("branch", "Mumbai"),
            "site": employee_data.get("site", "TCL BKC"),
            "skillDesig": employee_data.get("skillDesig", "S/G"),
            "clientDesig": employee_data.get("clientDesig", "S/G"),
            "email": employee_data.get("email", ""),
            "mobile": employee_data.get("mobile", ""),
            "weeklyOff": employee_data.get("weeklyOff", "SUNDAY"),
            "joinedOn": employee_data.get("joinedOn", "2026-01-01"),
            "releavedOn": "",
            "onBoard": employee_data.get("onBoard", True),
        }
        self._local_employees.insert(0, new_emp)
        return new_emp

    # ── 2. STANDARD DEPLOYMENT DETAILS API ────────────────────────────────────

    def get_deployment_details(
        self, client: str = "", branch: str = "", site: str = ""
    ) -> SiteDeploymentSummary:
        """
        Calculates deployment requirements, onboarded count, shortfall, and daily counts.
        """
        key = f"{client}|{branch}|{site}"
        base_reqs = DEFAULT_REQUIREMENTS.get(
            key,
            [
                {"designation": "ASM", "required": 1, "monFri": 1, "sat": 1, "sun": 0},
                {"designation": "S/G", "required": 131, "monFri": 116, "sat": 40, "sun": 76},
                {"designation": "S/SUP", "required": 5, "monFri": 3, "sat": 3, "sun": 3},
                {"designation": "S/OFF", "required": 4, "monFri": 3, "sat": 2, "sun": 2},
                {"designation": "L/SG", "required": 10, "monFri": 8, "sat": 4, "sun": 4},
                {"designation": "RELIEVE", "required": 0, "monFri": 0, "sat": 0, "sun": 0},
            ],
        )

        employees = self.get_employees(client=client, branch=branch, site=site, onboard_only=True)

        rows: List[DeploymentRow] = []
        tot_req = 0
        tot_onboard = 0

        for req in base_reqs:
            desig = req["designation"]
            # Count matching onboarded employees
            count = sum(
                1
                for e in employees
                if e.get("skillDesig") == desig or e.get("clientDesig") == desig
            )

            # Fallback to base requirement onboard count if data is unpopulated
            final_onboard = count if count > 0 else req.get("onboard", count)
            required = req["required"]
            shortfall = final_onboard - required

            row = DeploymentRow(
                designation=desig,
                required=required,
                onboard=final_onboard,
                shortfall=shortfall,
                monFri=req.get("monFri", 0),
                sat=req.get("sat", 0),
                sun=req.get("sun", 0),
            )
            rows.append(row)
            tot_req += required
            tot_onboard += final_onboard

        tot_shortfall = tot_onboard - tot_req

        return SiteDeploymentSummary(
            client=client or "All Clients",
            branch=branch or "All Branches",
            site=site or "All Sites",
            rows=rows,
            total_required=tot_req,
            total_onboard=tot_onboard,
            total_shortfall=tot_shortfall,
        )

    # ── 3. EXPORT & INTEGRATION HELPERS ────────────────────────────────────────

    def export_full_payload(self) -> Dict[str, Any]:
        """Generate a complete JSON export for external system integration."""
        employees = self.get_employees()
        onboarded = self.get_onboarded_employees()
        wipro_deploy = self.get_deployment_details("Wipro", "Pune", "WIPRO PDC - II")
        tata_deploy = self.get_deployment_details("Tata Communications", "Mumbai", "TCL BKC")

        return {
            "status": "success",
            "system": "QRDA Enterprise Portal Integration",
            "employee_directory": {
                "total_count": len(employees),
                "onboarded_count": len(onboarded),
                "employees": employees,
            },
            "standard_deployment": {
                "wipro_pue": wipro_deploy.to_dict(),
                "tata_bkc": tata_deploy.to_dict(),
            },
        }

    def save_to_json_file(self, filename: str = "qrda_export.json"):
        """Save deployment and employee data to a JSON file."""
        data = self.export_full_payload()
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"[SUCCESS] QRDA Integration Data exported to: {os.path.abspath(filename)}")


# ─── CLI COMMAND HANDLER ───────────────────────────────────────────────────────

def main():
    import sys

    service = QRDAService()

    print("==========================================================")
    print("      QRDA ENTERPRISE SERVICE INTEGRATION CLIENT         ")
    print("==========================================================")

    # 1. Employee Directory Summary
    emps = service.get_employees()
    onboarded = service.get_onboarded_employees()
    print(f"\n[+] Total Employees in Directory: {len(emps)}")
    print(f"[+] Active Onboarded Officers: {len(onboarded)}")

    print("\n--- Sample Employee Directory Entries ---")
    for e in emps[:3]:
        status = "On Board" if e.get("onBoard", True) else "Off Board"
        print(f" • [{e.get('empCode')}] {e.get('name')} | {e.get('client')} | {e.get('site')} | {status}")

    # 2. Standard Deployment Details Summary
    print("\n----------------------------------------------------------")
    print("            STANDARD DEPLOYMENT DETAILS SUMMARY          ")
    print("----------------------------------------------------------")
    deployment = service.get_deployment_details("Tata Communications", "Mumbai", "TCL BKC")
    print(f"Client: {deployment.client} | Branch: {deployment.branch} | Site: {deployment.site}")
    print(f"{'Designation':<12} | {'Required':<10} | {'Onboard':<10} | {'Shortfall':<10} | {'Mon-Fri':<8}")
    print("-" * 62)
    for r in deployment.rows:
        print(f"{r.designation:<12} | {r.required:<10} | {r.onboard:<10} | {r.shortfall:<10} | {r.monFri:<8}")
    print("-" * 62)
    print(f"{'Total':<12} | {deployment.total_required:<10} | {deployment.total_onboard:<10} | {deployment.total_shortfall:<10}")

    # 3. Export JSON for integration
    export_file = "qrda_integration_data.json"
    service.save_to_json_file(export_file)


if __name__ == "__main__":
    main()

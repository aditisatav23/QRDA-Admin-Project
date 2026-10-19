"""
================================================================================
QRDA ENTERPRISE INTEGRATION - SINGLE SCRIPT UTILITY
================================================================================
This self-contained Python script integrates both:
  1. EMPLOYEE DIRECTORY (Directory management, onboarding, filtering)
  2. STANDARD DEPLOYMENT DETAILS (Requirements, onboarded counts, shortfall, shift schedules)

It can be:
  - Imported directly into any Python app: `from qrda_integration import QRDAIntegration`
  - Executed standalone: `python qrda_integration.py`
================================================================================
"""

import json
import os
import urllib.request
import urllib.parse
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict


# ─── 1. DATA MODELS ────────────────────────────────────────────────────────────

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

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


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
class DeploymentSummary:
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


# ─── 2. DEFAULT FALLBACK DATASETS ──────────────────────────────────────────────

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


# ─── 3. SINGLE INTEGRATION CLASS ───────────────────────────────────────────────

class QRDAIntegration:
    """
    Unified integration manager for Employee Directory & Standard Deployment.
    Connects to live QRDA API (default http://localhost:8001) or falls back to in-memory store.
    """

    def __init__(self, base_url: str = "http://localhost:8001"):
        self.base_url = base_url.rstrip("/")
        self._employees: List[Dict[str, Any]] = list(DEFAULT_EMPLOYEES)

    def _api_request(self, endpoint: str, method: str = "GET", body: Dict[str, Any] = None) -> Optional[Any]:
        url = f"{self.base_url}{endpoint}"
        try:
            headers = {"User-Agent": "QRDA-Python-Client/1.0"}
            payload = None
            if body:
                headers["Content-Type"] = "application/json"
                payload = json.dumps(body).encode("utf-8")

            req = urllib.request.Request(url, data=payload, headers=headers, method=method)
            with urllib.request.urlopen(req, timeout=3) as resp:
                if resp.status in (200, 201):
                    return json.loads(resp.read().decode("utf-8"))
        except Exception:
            pass  # Fallback to local memory store if API unavailable
        return None

    # ── EMPLOYEE DIRECTORY METHODS ─────────────────────────────────────────────

    def get_employees(
        self,
        client: str = "",
        branch: str = "",
        site: str = "",
        onboard_only: bool = False,
    ) -> List[Dict[str, Any]]:
        """Fetch employee directory filtered by client, branch, site, or onboard status."""
        remote_res = self._api_request("/api/reports/employee-list")
        records = remote_res.get("items", []) if (remote_res and "items" in remote_res) else self._employees

        results = []
        for emp in records:
            e_client = emp.get("client") or emp.get("client_name") or ""
            e_branch = emp.get("branch") or "Mumbai"
            e_site = emp.get("site") or ""
            is_onboard = emp.get("onBoard") if "onBoard" in emp else emp.get("on_board", True)

            if client and client.lower() not in e_client.lower():
                continue
            if branch and branch.lower() not in e_branch.lower():
                continue
            if site and site.lower() not in e_site.lower():
                continue
            if onboard_only and not is_onboard:
                continue

            results.append(emp)
        return results

    def get_onboarded_employees(self) -> List[Dict[str, Any]]:
        """Get list of active/onboarded employees only."""
        return self.get_employees(onboard_only=True)

    def add_employee(self, emp_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new employee to the directory."""
        remote_res = self._api_request("/users/", method="POST", body=emp_data)
        if remote_res:
            return remote_res

        # Local fallback
        new_id = str(len(self._employees) + 200)
        new_entry = {
            "oid": new_id,
            "empCode": emp_data.get("empCode", f"EMP{new_id}"),
            "name": emp_data.get("name", "New Employee"),
            "client": emp_data.get("client", "Tata Communications"),
            "branch": emp_data.get("branch", "Mumbai"),
            "site": emp_data.get("site", "TCL BKC"),
            "skillDesig": emp_data.get("skillDesig", "S/G"),
            "clientDesig": emp_data.get("clientDesig", "S/G"),
            "email": emp_data.get("email", ""),
            "mobile": emp_data.get("mobile", ""),
            "weeklyOff": emp_data.get("weeklyOff", "SUNDAY"),
            "joinedOn": emp_data.get("joinedOn", "2026-01-01"),
            "releavedOn": "",
            "onBoard": emp_data.get("onBoard", True),
        }
        self._employees.insert(0, new_entry)
        return new_entry

    # ── STANDARD DEPLOYMENT DETAILS METHODS ────────────────────────────────────

    def get_deployment_details(
        self, client: str = "", branch: str = "", site: str = ""
    ) -> DeploymentSummary:
        """
        Calculate standard deployment details for a specific site or across all sites:
          - Required employee count
          - Onboard employee count (dynamically matched from employee directory)
          - Shortfall / Surplus count (Onboard - Required)
          - Required daily shift deployment counts (Mon-Fri, Sat, Sun)
        """
        key = f"{client}|{branch}|{site}"
        req_list = DEFAULT_REQUIREMENTS.get(
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

        onboarded = self.get_employees(client=client, branch=branch, site=site, onboard_only=True)

        rows: List[DeploymentRow] = []
        tot_req = 0
        tot_onboard = 0

        for r in req_list:
            desig = r["designation"]
            match_count = sum(
                1 for e in onboarded
                if e.get("skillDesig") == desig or e.get("clientDesig") == desig
            )
            final_onboard = match_count if match_count > 0 else r.get("onboard", match_count)
            req_count = r["required"]
            shortfall = final_onboard - req_count

            row = DeploymentRow(
                designation=desig,
                required=req_count,
                onboard=final_onboard,
                shortfall=shortfall,
                monFri=r.get("monFri", 0),
                sat=r.get("sat", 0),
                sun=r.get("sun", 0),
            )
            rows.append(row)
            tot_req += req_count
            tot_onboard += final_onboard

        return DeploymentSummary(
            client=client or "All Clients",
            branch=branch or "All Branches",
            site=site or "All Sites",
            rows=rows,
            total_required=tot_req,
            total_onboard=tot_onboard,
            total_shortfall=tot_onboard - tot_req,
        )

    def export_to_json(self, filepath: str = "qrda_single_export.json") -> str:
        """Export full employee directory & deployment metrics to a JSON file."""
        payload = {
            "employee_directory": self.get_employees(),
            "deployment_summary": self.get_deployment_details().to_dict(),
        }
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
        return os.path.abspath(filepath)


# ─── 4. STANDALONE RUNNER & QUICK DEMO ─────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 70)
    print("   QRDA ENTERPRISE INTEGRATION - SINGLE SCRIPT RUNNER   ")
    print("=" * 70)

    # Initialize integration instance
    qrda = QRDAIntegration()

    # 1. Employee Directory Demo
    all_employees = qrda.get_employees()
    onboarded_employees = qrda.get_onboarded_employees()
    print(f"\n[+] Total Employee Directory Count: {len(all_employees)}")
    print(f"[+] Total Onboarded Officers:       {len(onboarded_employees)}")

    print("\n--- Employee Directory Sample ---")
    for emp in all_employees[:3]:
        status = "On Board" if emp.get("onBoard", True) else "Off Board"
        print(f" • [{emp.get('empCode')}] {emp.get('name')} | {emp.get('client')} | {emp.get('site')} | {status}")

    # 2. Standard Deployment Details Demo
    print("\n" + "=" * 70)
    print("          STANDARD DEPLOYMENT DETAILS (DEMO LOCATION)         ")
    print("=" * 70)
    deployment = qrda.get_deployment_details("Tata Communications", "Mumbai", "TCL BKC")
    print(f"Client: {deployment.client} | Branch: {deployment.branch} | Site: {deployment.site}")
    print("-" * 70)
    print(f"{'Designation':<12} | {'Required':<10} | {'Onboard':<10} | {'Shortfall':<10} | {'Mon-Fri':<8}")
    print("-" * 70)
    for r in deployment.rows:
        print(f"{r.designation:<12} | {r.required:<10} | {r.onboard:<10} | {r.shortfall:<10} | {r.monFri:<8}")
    print("-" * 70)
    print(f"{'Total':<12} | {deployment.total_required:<10} | {deployment.total_onboard:<10} | {deployment.total_shortfall:<10}")

    # 3. Add Employee & Export JSON Payload
    print("\n" + "=" * 70)
    print("                  ADDING EMPLOYEE & EXPORTING                ")
    print("=" * 70)
    new_employee = qrda.add_employee({
        "empCode": "EMP8840",
        "name": "Sunil Verma",
        "client": "Tata Communications",
        "branch": "Mumbai",
        "site": "TCL BKC",
        "skillDesig": "S/G",
        "clientDesig": "S/G",
        "mobile": "9820011223",
        "onBoard": True
    })
    print(f"[+] Added Employee: {new_employee['name']} ({new_employee['empCode']})")

    exported_path = qrda.export_to_json("qrda_single_export.json")
    print(f"[SUCCESS] Exported single-file integration payload to:\n    {exported_path}")

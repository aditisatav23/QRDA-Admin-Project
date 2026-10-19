"""
Third-Party Project Integration Example
---------------------------------------
This script demonstrates how an external Python app (Flask, FastAPI, Django, Pandas, script)
can import and consume the QRDA Employee Directory and Standard Deployment Details.
"""

from qrda_service import QRDAService

def main():
    # Initialize the QRDA Service Client
    qrda = QRDAService(base_url="http://localhost:8001")

    # 1. Fetch Onboarded Employees for a specific client & site
    print("=== 1. FETCHING ONBOARDED EMPLOYEES ===")
    tata_employees = qrda.get_employees(client="Tata Communications", site="TCL BKC", onboard_only=True)
    for emp in tata_employees:
        print(f"Code: {emp.get('empCode')} | Name: {emp.get('name')} | Designation: {emp.get('skillDesig')}")

    # 2. Fetch Standard Deployment Details
    print("\n=== 2. FETCHING STANDARD DEPLOYMENT DETAILS ===")
    deployment = qrda.get_deployment_details(client="Wipro", branch="Pune", site="WIPRO PDC - II")
    print(f"Site: {deployment.site}")
    print(f"Total Required: {deployment.total_required} | Total Onboard: {deployment.total_onboard} | Shortfall: {deployment.total_shortfall}")
    for row in deployment.rows:
        print(f" - {row.designation}: Required={row.required}, Onboard={row.onboard}, Shortfall={row.shortfall}")

    # 3. Add a New Employee to Directory
    print("\n=== 3. ADDING NEW EMPLOYEE ===")
    new_emp = qrda.add_employee({
        "empCode": "EMP9901",
        "name": "Rajesh Kumar",
        "client": "Tata Communications",
        "branch": "Mumbai",
        "site": "TCL BKC",
        "skillDesig": "S/G",
        "clientDesig": "S/G",
        "mobile": "9811223344",
        "onBoard": True
    })
    print(f"Added: {new_emp['name']} ({new_emp['empCode']})")

    # 4. Export complete payload to JSON
    qrda.save_to_json_file("external_app_export.json")

if __name__ == "__main__":
    main()

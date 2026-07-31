#!/usr/bin/env node
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = process.env.SMOKE_API_BASE ?? "http://localhost:3001";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tmpDir = path.join(__dirname, "../tmp-smoke");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function tinyPdf() {
  // Minimal valid-ish PDF bytes for upload mime checks; server regenerates packet.
  return Buffer.from(
    `%PDF-1.1
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj
4 0 obj<< /Length 44 >>stream
BT /F1 18 Tf 40 80 Td (CoastApply Smoke) Tj ET
endstream endobj
5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000063 00000 n 
0000000124 00000 n 
0000000273 00000 n 
0000000368 00000 n 
trailer<< /Size 6 /Root 1 0 R >>
startxref
445
%%EOF`,
    "utf8",
  );
}

async function main() {
  await mkdir(tmpDir, { recursive: true });
  const results = [];

  // 1) Health
  {
    const res = await fetch(`${API}/api/health`);
    const data = await res.json();
    assert(res.ok && data.success === true, "health check failed");
    results.push(["health", "PASS"]);
  }

  // 2) Invite (with Origin header like a browser on the tunnel/domain)
  {
    const res = await fetch(`${API}/api/application/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: API,
      },
      body: JSON.stringify({
        invitee_email: "coapplicant@example.com",
        inviter_name: "Smoke Tester",
        inviter_email: "primary@example.com",
        application_group: "smoke-group-001",
      }),
    });
    const data = await res.json();
    assert(res.ok && data.success === true, `invite failed: ${JSON.stringify(data)}`);
    assert(typeof data.invite_url === "string" && data.invite_url.includes("invite="), "invite_url missing");
    results.push(["invite", "PASS"]);
    results.push(["cors_invite", "PASS"]);
  }

  // 3) Validation rejection
  {
    const body = new FormData();
    body.append("payload", JSON.stringify({ application_group: "x" }));
    const res = await fetch(`${API}/api/application/submit`, { method: "POST", body });
    const data = await res.json();
    assert(res.status === 400 && data.success === false, "expected validation failure");
    results.push(["submit_validation", "PASS"]);
  }

  // 4) Full submit with documents
  {
    const pdf = await tinyPdf();
    const payload = {
      application_group: "smoke-group-001",
      applicant: {
        first_name: "Avery",
        last_name: "Nguyen",
        email: "avery.nguyen@example.com",
        phone: "+1-555-0100",
        date_of_birth: "1990-04-12",
      },
      identity: {
        nationality: "Australian",
        drivers_licence: {
          number: "D1234567",
          state: "NSW",
          expiry: "2028-04-12",
        },
        passport: {
          number: "PA1234567",
          country: "Australia",
          expiry: "2030-01-01",
        },
        medicare: {
          card_number: "2123456781",
          reference_number: "1",
          card_colour: "green",
          expiry: "12/2028",
        },
      },
      employment: {
        status: "employed",
        employer: "Coastal Commercial Property",
        job_title: "Analyst",
        monthly_income: "6200",
        start_date: "2022-01-15",
      },
      address: {
        current_address: "100 Harbor Way",
        city: "Sydney",
        state: "NSW",
        postal_code: "2000",
        years_at_address: "2",
        monthly_rent: "2400",
        landlord_name: "Jordan Lee",
        landlord_phone: "+61-400-000-199",
        previous_address: "55 Pine St",
      },
      household: {
        people_living_in_household: "2",
        dependents: "0",
        has_pets: "no",
        pet_details: "",
      },
      references: {
        reference_1_name: "Sam Rivera",
        reference_1_phone: "+61-400-000-111",
        reference_1_email: "sam@example.com",
        reference_1_relationship: "Manager",
        reference_2_name: "Casey Brooks",
        reference_2_phone: "+61-400-000-112",
        reference_2_email: "casey@example.com",
        reference_2_relationship: "Colleague",
      },
      declaration: {
        accepted: true,
        signature_name: "Avery Nguyen",
        signed_at: new Date().toISOString(),
      },
      co_applicants: [{ email: "coapplicant@example.com", status: "sent" }],
    };

    const body = new FormData();
    body.append("payload", JSON.stringify(payload));
    const blob = new Blob([pdf], { type: "application/pdf" });
    body.append("drivers_licence_front", blob, "licence-front.pdf");
    body.append("drivers_licence_back", blob, "licence-back.pdf");
    body.append("passport_photo", blob, "passport.pdf");
    body.append("medicare_photo", blob, "medicare.pdf");
    body.append("payslips", blob, "payslip.pdf");
    body.append("bank_statements", blob, "bank.pdf");
    body.append("other_documents", blob, "other.pdf");
    body.append("summary_pdf", blob, "summary.pdf");

    const res = await fetch(`${API}/api/application/submit`, {
      method: "POST",
      headers: { Origin: API },
      body,
    });
    const data = await res.json();
    assert(res.ok && data.success === true && data.submission_id, `submit failed: ${JSON.stringify(data)}`);
    await writeFile(path.join(tmpDir, "last-submit.json"), JSON.stringify(data, null, 2));
    results.push(["submit_e2e", "PASS"]);
    results.push(["uploads_persisted", data.files?.length ? "PASS" : "FAIL"]);
    results.push(["pdf_packet", data.files?.some((f) => String(f.key).includes("summary")) ? "PASS" : "FAIL"]);
  }

  console.log("Smoke test results:");
  for (const [name, status] of results) {
    console.log(`- ${name}: ${status}`);
  }
  if (results.some(([, s]) => s !== "PASS")) {
    process.exit(1);
  }
  console.log("All smoke checks passed.");
}

main().catch((err) => {
  console.error("Smoke test failed:", err.message);
  process.exit(1);
});

// Sample openings so the showcase Careers page is not empty on first launch.
// Set SEED_DEMO_DATA=0 to disable. HR can edit or delete these from the Admin portal.
import { db, newId } from "./store.mjs";

export async function ensureSeed() {
  if (process.env.SEED_DEMO_DATA === "0") return;
  const meta = db("meta");
  if (await meta.get("seeded")) return;
  await meta.set("seeded", { at: new Date().toISOString() });

  const now = new Date().toISOString();
  const jobs = [
    { title: "ASIC Design Verification Engineer", domain: "Semiconductor", type: "Permanent", location: "Bengaluru, India", experience: "4-8 years",
      skills: "SystemVerilog, UVM, Coverage closure, SoC/IP verification",
      description: "Verify complex IP and SoC designs for a semiconductor design client. Own testbench architecture, coverage closure and debug.",
      requirements: "B.E./M.Tech in Electronics or related field\nStrong SystemVerilog & UVM\nExperience with IP or SoC-level verification" },
    { title: "Physical Design Engineer", domain: "Semiconductor", type: "Contract", location: "Hyderabad, India", experience: "3-7 years",
      skills: "Floorplanning, PnR, STA, Innovus/ICC2",
      description: "Contract role supporting block-level physical design from netlist to GDS for advanced-node projects.",
      requirements: "Hands-on block-level PnR\nTiming closure & STA\nExperience on 7nm or below preferred" },
    { title: "Embedded Software Engineer", domain: "Engineering", type: "Contract-to-hire", location: "Pune, India", experience: "3-6 years",
      skills: "Embedded C, RTOS, ARM Cortex-M, CAN",
      description: "Develop firmware for automotive and mobility products, from drivers to application layers.",
      requirements: "Embedded C on microcontrollers\nRTOS experience\nDebugging with JTAG / oscilloscopes" },
    { title: "Senior Full Stack Developer", domain: "IT", type: "Permanent", location: "Remote / Hybrid", experience: "5-9 years",
      skills: "React, Node.js, TypeScript, SQL, AWS",
      description: "Build and scale web platforms for a software product client.",
      requirements: "Strong JavaScript/TypeScript\nAPI design and SQL\nCloud deployment experience" },
    { title: "Director – Silicon Engineering", domain: "Semiconductor", type: "Executive Search", location: "Bengaluru, India", experience: "15+ years",
      skills: "Engineering leadership, SoC programs, Team building",
      description: "Confidential executive search for a leader to head a growing silicon engineering organisation.",
      requirements: "Led large SoC programs end-to-end\nBuilt and scaled engineering teams\nStakeholder & customer management" },
  ];
  for (const j of jobs) {
    const id = newId("job_");
    await db("jobs").set(id, { id, ...j, status: "open", createdAt: now, updatedAt: now, createdBy: "system" });
  }
}

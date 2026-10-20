import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("InternshipPlatform Smart Contract", function () {
  let platform;
  let company, student, other;

  beforeEach(async function () {
    [company, student, other] = await ethers.getSigners();
    const InternshipPlatform = await ethers.getContractFactory("InternshipPlatform");
    platform = await InternshipPlatform.deploy();
    await platform.waitForDeployment();
  });

  it("Cho phep cong ty tao de tai moi", async function () {
    const now = Math.floor(Date.now() / 1000);
    const tx = await platform.connect(company).createTopic(
      "Phan mem Web3 quan ly KPI",
      "QmHashDetails123",
      now,
      now + 86400 * 30
    );
    await tx.wait();

    const topic = await platform.topics(1);
    expect(topic.title).to.equal("Phan mem Web3 quan ly KPI");
    expect(topic.company).to.equal(company.address);
    expect(topic.status).to.equal(0n); // Open
  });

  it("Cho phep cong ty them KPI va phan cong sinh vien", async function () {
    const now = Math.floor(Date.now() / 1000);
    await platform.connect(company).createTopic(
      "Phan mem Web3 quan ly KPI",
      "QmHashDetails123",
      now,
      now + 86400 * 30
    );

    // Them KPI 1: 50%
    await platform.connect(company).addKPI(1, "Milestone 1: Smart Contract", "Xay dung va test contract", now + 86400 * 10, 50);
    // Them KPI 2: 50%
    await platform.connect(company).addKPI(1, "Milestone 2: Frontend & Deploy", "Giao dien va deploy Netlify", now + 86400 * 20, 50);

    const kpiCount = await platform.getKPICount(1);
    expect(kpiCount).to.equal(2n);

    // Phan cong sinh vien
    await platform.connect(company).assignStudent(1, student.address);
    const topic = await platform.topics(1);
    expect(topic.student).to.equal(student.address);
    expect(topic.status).to.equal(1n); // Assigned
  });

  it("Sinh vien nop bao cao va cong ty nghiem thu KPI tren blockchain", async function () {
    const now = Math.floor(Date.now() / 1000);
    await platform.connect(company).createTopic("De tai AI Web3", "QmHash", now, now + 86400 * 30);
    await platform.connect(company).addKPI(1, "Bao cao khao sat", "Chi tiet khao sat", now + 86400 * 5, 100);
    await platform.connect(company).assignStudent(1, student.address);

    // Sinh vien nop bai
    await platform.connect(student).submitKPI(1, 0, "QmReportSubmissionHash456");

    let kpis = await platform.getTopicKPIs(1);
    expect(kpis[0].submissionIpfsHash).to.equal("QmReportSubmissionHash456");
    expect(kpis[0].status).to.equal(1n); // Submitted

    // Mentor cham diem (95 diem, Approved = 2)
    await platform.connect(company).evaluateKPI(1, 0, 2, 95, "Bao cao rat tot va dung han");
    kpis = await platform.getTopicKPIs(1);
    expect(kpis[0].status).to.equal(2n); // Approved
    expect(kpis[0].score).to.equal(95n);

    // Tong ket va cap chung nhan
    await platform.connect(company).completeInternship(1, "QmCertificateHash789");
    const updatedTopic = await platform.topics(1);
    expect(updatedTopic.status).to.equal(3n); // Completed
    expect(updatedTopic.finalScore).to.equal(95n);
    expect(updatedTopic.certificateIssued).to.equal(true);
  });
});

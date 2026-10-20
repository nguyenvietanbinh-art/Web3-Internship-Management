// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title InternshipPlatform
 * @dev Quản lý đề tài thực tập, phân công sinh viên, nghiệm thu KPI minh bạch và cấp chứng nhận trên Blockchain.
 * Đảm bảo tính chống gian lận và tính toàn vẹn của dữ liệu thông qua IPFS hashes và on-chain state machine.
 */
contract InternshipPlatform {
    enum ProjectStatus { Open, Assigned, InProgress, Completed, Terminated }
    enum KPIStatus { Pending, Submitted, Approved, Rejected }

    struct KPI {
        string title;
        string description;
        uint256 deadline;
        uint8 weightPercent;       // Tổng trọng số các KPI của 1 đề tài = 100%
        string submissionIpfsHash; // Hash báo cáo/minh chứng do sinh viên nộp lên IPFS
        uint8 score;               // Thang điểm 0 - 100
        string mentorFeedback;     // Nhận xét của Mentor
        KPIStatus status;
        uint256 submittedAt;
        uint256 evaluatedAt;
    }

    struct ProjectTopic {
        uint256 id;
        string title;
        string ipfsDetailsHash;    // Mô tả chi tiết đề tài lưu trên IPFS
        address company;           // Địa chỉ ví của Doanh nghiệp / Mentor
        address student;           // Địa chỉ ví của Sinh viên được phân công
        uint256 createdAt;
        uint256 startDate;
        uint256 endDate;
        ProjectStatus status;
        uint8 finalScore;          // Điểm tổng kết sau khi nghiệm thu toàn bộ KPI
        bool certificateIssued;    // Đã cấp chứng nhận hoàn thành
        string certificateIpfsHash;// Metadata chứng nhận thực tập trên IPFS
    }

    uint256 public nextTopicId = 1;

    // topicId => ProjectTopic
    mapping(uint256 => ProjectTopic) public topics;
    // topicId => danh sách KPI
    mapping(uint256 => KPI[]) public topicKPIs;

    // Mapping quản lý profile rút gọn
    mapping(address => string) public userNames;
    mapping(address => string) public userRoles; // "company" hoặc "student"

    // Events
    event ProfileUpdated(address indexed user, string name, string role);
    event TopicCreated(uint256 indexed topicId, address indexed company, string title, string ipfsDetailsHash);
    event KPICreated(uint256 indexed topicId, uint256 milestoneIndex, string title, uint8 weightPercent, uint256 deadline);
    event TopicAssigned(uint256 indexed topicId, address indexed student);
    event KPISubmitted(uint256 indexed topicId, uint256 milestoneIndex, address indexed student, string submissionIpfsHash);
    event KPIEvaluated(uint256 indexed topicId, uint256 milestoneIndex, KPIStatus status, uint8 score, string mentorFeedback);
    event InternshipCompleted(uint256 indexed topicId, address indexed student, uint8 finalScore, string certificateIpfsHash);

    modifier onlyCompany(uint256 _topicId) {
        require(topics[_topicId].company == msg.sender, "Chi cong ty so huu de tai moi co quyen");
        _;
    }

    modifier onlyAssignedStudent(uint256 _topicId) {
        require(topics[_topicId].student == msg.sender, "Chi sinh vien duoc phan cong moi co quyen");
        _;
    }

    // Đăng ký thông tin Profile
    function registerProfile(string calldata _name, string calldata _role) external {
        require(bytes(_name).length > 0, "Ten khong duoc de trong");
        userNames[msg.sender] = _name;
        userRoles[msg.sender] = _role;
        emit ProfileUpdated(msg.sender, _name, _role);
    }

    // 1. Doanh nghiệp tạo đề tài thực tập
    function createTopic(
        string calldata _title,
        string calldata _ipfsDetailsHash,
        uint256 _startDate,
        uint256 _endDate
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Tieu de khong duoc de trong");
        require(_endDate > _startDate, "Ngay ket thuc phai sau ngay bat dau");

        uint256 topicId = nextTopicId++;
        topics[topicId] = ProjectTopic({
            id: topicId,
            title: _title,
            ipfsDetailsHash: _ipfsDetailsHash,
            company: msg.sender,
            student: address(0),
            createdAt: block.timestamp,
            startDate: _startDate,
            endDate: _endDate,
            status: ProjectStatus.Open,
            finalScore: 0,
            certificateIssued: false,
            certificateIpfsHash: ""
        });

        emit TopicCreated(topicId, msg.sender, _title, _ipfsDetailsHash);
        return topicId;
    }

    // 2. Thêm KPI / Milestone cho đề tài
    function addKPI(
        uint256 _topicId,
        string calldata _title,
        string calldata _description,
        uint256 _deadline,
        uint8 _weightPercent
    ) external onlyCompany(_topicId) {
        require(topics[_topicId].status == ProjectStatus.Open || topics[_topicId].status == ProjectStatus.Assigned, "Khong the them KPI o trang thai nay");
        require(_weightPercent > 0 && _weightPercent <= 100, "Trong so KPI khong hop le");
        uint256 currentWeight = 0;
        for (uint256 i = 0; i < topicKPIs[_topicId].length; i++) {
            currentWeight += topicKPIs[_topicId][i].weightPercent;
        }
        require(currentWeight + _weightPercent <= 100, "Tong trong so KPI vuot qua 100%");

        KPI memory newKPI = KPI({
            title: _title,
            description: _description,
            deadline: _deadline,
            weightPercent: _weightPercent,
            submissionIpfsHash: "",
            score: 0,
            mentorFeedback: "",
            status: KPIStatus.Pending,
            submittedAt: 0,
            evaluatedAt: 0
        });

        topicKPIs[_topicId].push(newKPI);
        uint256 milestoneIndex = topicKPIs[_topicId].length - 1;

        emit KPICreated(_topicId, milestoneIndex, _title, _weightPercent, _deadline);
    }

    // 3. Phân công sinh viên vào đề tài
    function assignStudent(uint256 _topicId, address _student) external onlyCompany(_topicId) {
        require(topics[_topicId].status == ProjectStatus.Open, "De tai da duoc phan cong");
        require(_student != address(0), "Dia chi sinh vien khong hop le");

        topics[_topicId].student = _student;
        topics[_topicId].status = ProjectStatus.Assigned;

        emit TopicAssigned(_topicId, _student);
    }

    // 4. Sinh viên nộp báo cáo / minh chứng KPI lên IPFS
    function submitKPI(
        uint256 _topicId,
        uint256 _milestoneIndex,
        string calldata _submissionIpfsHash
    ) external onlyAssignedStudent(_topicId) {
        require(_milestoneIndex < topicKPIs[_topicId].length, "Chi muc KPI khong ton tai");
        KPI storage kpi = topicKPIs[_topicId][_milestoneIndex];
        require(kpi.status != KPIStatus.Approved, "KPI da duoc duyet, khong the nop lai");
        require(bytes(_submissionIpfsHash).length > 0, "Can co IPFS hash cua bao cao");

        kpi.submissionIpfsHash = _submissionIpfsHash;
        kpi.status = KPIStatus.Submitted;
        kpi.submittedAt = block.timestamp;

        if (topics[_topicId].status == ProjectStatus.Assigned) {
            topics[_topicId].status = ProjectStatus.InProgress;
        }

        emit KPISubmitted(_topicId, _milestoneIndex, msg.sender, _submissionIpfsHash);
    }

    // 5. Mentor nghiệm thu và chấm điểm KPI
    function evaluateKPI(
        uint256 _topicId,
        uint256 _milestoneIndex,
        KPIStatus _status,
        uint8 _score,
        string calldata _feedback
    ) external onlyCompany(_topicId) {
        require(_milestoneIndex < topicKPIs[_topicId].length, "Chi muc KPI khong ton tai");
        require(_status == KPIStatus.Approved || _status == KPIStatus.Rejected, "Trang thai danh gia phai la Approved hoac Rejected");
        require(_score <= 100, "Diem toi da la 100");

        KPI storage kpi = topicKPIs[_topicId][_milestoneIndex];
        require(kpi.status == KPIStatus.Submitted, "Sinh vien chua nop bao cao KPI nay");

        kpi.status = _status;
        kpi.score = _score;
        kpi.mentorFeedback = _feedback;
        kpi.evaluatedAt = block.timestamp;

        emit KPIEvaluated(_topicId, _milestoneIndex, _status, _score, _feedback);
    }

    // 6. Tổng kết hoàn thành thực tập và cấp chứng nhận on-chain
    function completeInternship(
        uint256 _topicId,
        string calldata _certificateIpfsHash
    ) external onlyCompany(_topicId) {
        ProjectTopic storage topic = topics[_topicId];
        require(topic.status == ProjectStatus.InProgress || topic.status == ProjectStatus.Assigned, "Trang thai khong hop le de ket thuc");
        require(!topic.certificateIssued, "Chung nhan da duoc cap");
        require(topicKPIs[_topicId].length > 0, "De tai chua co KPI");

        uint256 totalWeight = 0;
        uint256 weightedScore = 0;

        for (uint256 i = 0; i < topicKPIs[_topicId].length; i++) {
            KPI storage kpi = topicKPIs[_topicId][i];
            require(kpi.status == KPIStatus.Approved, "Tat ca KPI phai duoc duyet truoc khi cap chung nhan");
            totalWeight += kpi.weightPercent;
            weightedScore += (uint256(kpi.score) * kpi.weightPercent);
        }

        require(totalWeight == 100, "Tong trong so cac KPI phai la 100%");
        uint8 finalScore = uint8(weightedScore / 100);

        topic.status = ProjectStatus.Completed;
        topic.finalScore = finalScore;
        topic.certificateIssued = true;
        topic.certificateIpfsHash = _certificateIpfsHash;

        emit InternshipCompleted(_topicId, topic.student, finalScore, _certificateIpfsHash);
    }

    // View: lấy số lượng KPI của 1 đề tài
    function getKPICount(uint256 _topicId) external view returns (uint256) {
        return topicKPIs[_topicId].length;
    }

    // View: lấy toàn bộ danh sách KPI của 1 đề tài
    function getTopicKPIs(uint256 _topicId) external view returns (KPI[] memory) {
        return topicKPIs[_topicId];
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title InternshipRegistry
/// @notice On-chain commitments for internship topics, assignments, evidence and scores.
/// Long descriptions, profiles and AI output remain off-chain in MongoDB/IPFS.
contract InternshipRegistry {
    enum TopicStatus { Open, Assigned, Closed }
    enum AssignmentStatus { Assigned, Submitted, Evaluated }

    struct Topic {
        uint256 id;
        address company;
        uint64 deadline;
        uint32 maxSlots;
        uint32 assignmentCount;
        TopicStatus status;
    }

    struct Assignment {
        uint256 id;
        uint256 topicId;
        address student;
        uint16 kpiAtAssign;
        AssignmentStatus status;
    }

    struct Submission {
        uint256 assignmentId;
        string cid;
        bytes32 fileHash;
        uint64 timestamp;
    }

    struct Evaluation {
        uint256 assignmentId;
        uint8 score;
        address evaluator;
        uint64 timestamp;
    }

    uint256 public nextTopicId = 1;
    uint256 public nextAssignmentId = 1;
    mapping(uint256 => Topic) public topics;
    mapping(uint256 => Assignment) public assignments;
    mapping(uint256 => Submission) public latestSubmissions;
    mapping(uint256 => Evaluation) public evaluations;
    mapping(uint256 => uint256[]) private topicAssignmentIds;

    event TopicCreated(uint256 indexed topicId, address indexed company, uint64 deadline, uint32 maxSlots);
    event TopicStatusChanged(uint256 indexed topicId, TopicStatus status);
    event AssignmentCreated(uint256 indexed assignmentId, uint256 indexed topicId, address indexed student, uint16 kpiAtAssign);
    event SubmissionRecorded(uint256 indexed assignmentId, string cid, bytes32 fileHash, uint64 timestamp);
    event EvaluationRecorded(uint256 indexed assignmentId, uint8 score, address indexed evaluator, uint64 timestamp);

    modifier onlyCompany(uint256 topicId) {
        require(topics[topicId].company == msg.sender, "Only topic company");
        _;
    }

    function createTopic(uint64 deadline, uint32 maxSlots) external returns (uint256 topicId) {
        require(deadline > block.timestamp, "Deadline must be in future");
        require(maxSlots > 0, "At least one slot required");
        topicId = nextTopicId++;
        topics[topicId] = Topic(topicId, msg.sender, deadline, maxSlots, 0, TopicStatus.Open);
        emit TopicCreated(topicId, msg.sender, deadline, maxSlots);
    }

    function assignStudent(uint256 topicId, address student, uint16 kpiAtAssign) external onlyCompany(topicId) returns (uint256 assignmentId) {
        Topic storage topic = topics[topicId];
        require(topic.status == TopicStatus.Open, "Topic is not open");
        require(student != address(0), "Invalid student address");
        require(kpiAtAssign <= 100, "KPI snapshot must be 0-100");
        require(topic.assignmentCount < topic.maxSlots, "No slots remaining");

        assignmentId = nextAssignmentId++;
        assignments[assignmentId] = Assignment(assignmentId, topicId, student, kpiAtAssign, AssignmentStatus.Assigned);
        topicAssignmentIds[topicId].push(assignmentId);
        topic.assignmentCount++;
        topic.status = topic.assignmentCount == topic.maxSlots ? TopicStatus.Assigned : TopicStatus.Open;
        emit AssignmentCreated(assignmentId, topicId, student, kpiAtAssign);
    }

    function submitEvidence(uint256 assignmentId, string calldata cid, bytes32 fileHash) external {
        Assignment storage assignment = assignments[assignmentId];
        require(assignment.student == msg.sender, "Only assigned student");
        require(assignment.status != AssignmentStatus.Evaluated, "Assignment already evaluated");
        require(bytes(cid).length > 0, "IPFS CID required");
        require(fileHash != bytes32(0), "File hash required");

        uint64 submittedAt = uint64(block.timestamp);
        latestSubmissions[assignmentId] = Submission(assignmentId, cid, fileHash, submittedAt);
        assignment.status = AssignmentStatus.Submitted;
        emit SubmissionRecorded(assignmentId, cid, fileHash, submittedAt);
    }

    function evaluate(uint256 assignmentId, uint8 score) external {
        Assignment storage assignment = assignments[assignmentId];
        require(topics[assignment.topicId].company == msg.sender, "Only topic company");
        require(assignment.status == AssignmentStatus.Submitted, "Submission required");
        require(score <= 100, "Score must be 0-100");

        uint64 evaluatedAt = uint64(block.timestamp);
        evaluations[assignmentId] = Evaluation(assignmentId, score, msg.sender, evaluatedAt);
        assignment.status = AssignmentStatus.Evaluated;
        emit EvaluationRecorded(assignmentId, score, msg.sender, evaluatedAt);
    }

    function closeTopic(uint256 topicId) external onlyCompany(topicId) {
        require(topics[topicId].status != TopicStatus.Closed, "Topic already closed");
        topics[topicId].status = TopicStatus.Closed;
        emit TopicStatusChanged(topicId, TopicStatus.Closed);
    }

    function getTopicAssignmentIds(uint256 topicId) external view returns (uint256[] memory) {
        return topicAssignmentIds[topicId];
    }
}

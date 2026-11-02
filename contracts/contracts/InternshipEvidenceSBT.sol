// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Local/test evidence registry and permanently locked ERC721/ERC5192 certificate.
/// Academic facts are attested by an authorized issuer, not independently read from MongoDB.
contract InternshipEvidenceSBT {
    string public constant name = "Internship Completion SBT";
    string public constant symbol = "INTSBT";
    address public immutable owner;
    mapping(address => bool) public writers;
    mapping(bytes32 => bool) public usedOperations;
    mapping(bytes32 => address) public assignmentStudent;
    mapping(bytes32 => bytes32) public latestReportHash;
    mapping(bytes32 => uint256) public attendanceCount;
    mapping(bytes32 => bytes32) public completionHash;
    mapping(bytes32 => uint256) public tokenForAssignment;
    mapping(uint256 => bytes32) public assignmentForToken;
    mapping(uint256 => address) private owners;
    mapping(address => uint256) private balances;
    uint256 public nextTokenId = 1;

    struct Evidence { bytes32 assignment; bytes32 digest; address subject; uint8 kind; string refURI; }
    mapping(bytes32 => Evidence) public evidence;
    event WriterChanged(address indexed writer, bool authorized);
    event EvidenceRecorded(bytes32 indexed operationId, bytes32 indexed assignment, uint8 kind, bytes32 digest, address subject, string refURI);
    event CertificateIssued(bytes32 indexed operationId, bytes32 indexed assignment, uint256 indexed tokenId, address student, bytes32 completionCommitment);
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event Locked(uint256 tokenId);

    modifier onlyWriter() { require(writers[msg.sender], "Writer only"); _; }
    constructor() { owner = msg.sender; writers[msg.sender] = true; }

    function setWriter(address writer, bool authorized) external {
        require(msg.sender == owner, "Owner only"); require(writer != address(0), "Zero writer");
        writers[writer] = authorized; emit WriterChanged(writer, authorized);
    }

    function recordEvidence(bytes32 operationId, bytes32 assignment, uint8 kind, bytes32 digest, address subject, string calldata refURI) external onlyWriter {
        require(operationId != bytes32(0) && !usedOperations[operationId], "Operation replay");
        require(assignment != bytes32(0) && digest != bytes32(0) && subject != address(0), "Invalid evidence");
        require(kind >= 1 && kind <= 3 && bytes(refURI).length <= 200, "Invalid evidence type");
        require(tokenForAssignment[assignment] == 0, "Assignment already certified");
        address prior = assignmentStudent[assignment];
        require(prior == address(0) || prior == subject, "Student mismatch");
        if (kind == 3) require(latestReportHash[assignment] != bytes32(0) && attendanceCount[assignment] > 0, "Report and attendance required");
        assignmentStudent[assignment] = subject; usedOperations[operationId] = true;
        evidence[operationId] = Evidence(assignment, digest, subject, kind, refURI);
        if (kind == 1) latestReportHash[assignment] = digest;
        if (kind == 2) attendanceCount[assignment]++;
        if (kind == 3) completionHash[assignment] = digest;
        emit EvidenceRecorded(operationId, assignment, kind, digest, subject, refURI);
    }

    function mintCertificate(bytes32 operationId, bytes32 assignment, address student) external onlyWriter returns (uint256 tokenId) {
        require(operationId != bytes32(0) && !usedOperations[operationId], "Operation replay");
        require(assignmentStudent[assignment] == student && student != address(0), "Student mismatch");
        require(completionHash[assignment] != bytes32(0), "Completion approval required");
        require(tokenForAssignment[assignment] == 0, "Already certified");
        usedOperations[operationId] = true;
        tokenId = nextTokenId++; owners[tokenId] = student; balances[student]++;
        tokenForAssignment[assignment] = tokenId; assignmentForToken[tokenId] = assignment;
        emit Transfer(address(0), student, tokenId); emit Locked(tokenId);
        emit CertificateIssued(operationId, assignment, tokenId, student, completionHash[assignment]);
        if (student.code.length > 0) {
            (bool ok, bytes memory result) = student.call(abi.encodeWithSignature("onERC721Received(address,address,uint256,bytes)", msg.sender, address(0), tokenId, ""));
            require(ok && result.length >= 32 && abi.decode(result, (bytes4)) == bytes4(0x150b7a02), "Unsafe recipient");
        }
    }

    function supportsInterface(bytes4 id) external pure returns (bool) { return id == 0x01ffc9a7 || id == 0x80ac58cd || id == 0x5b5e139f || id == 0xb45a3c0e; }
    function ownerOf(uint256 id) public view returns (address) { require(owners[id] != address(0), "Unknown certificate"); return owners[id]; }
    function balanceOf(address account) external view returns (uint256) { require(account != address(0), "Zero address"); return balances[account]; }
    function locked(uint256 id) external view returns (bool) { ownerOf(id); return true; }
    function tokenURI(uint256 id) external view returns (string memory) {
        ownerOf(id);
        return 'data:application/json;utf8,{"name":"Internship Completion SBT","description":"Issuer-attested completion. No personal report data in metadata.","soulbound":true}';
    }
    function getApproved(uint256 id) external view returns (address) { ownerOf(id); return address(0); }
    function isApprovedForAll(address, address) external pure returns (bool) { return false; }
    function approve(address, uint256) external pure { revert("Soulbound"); }
    function setApprovalForAll(address, bool) external pure { revert("Soulbound"); }
    function transferFrom(address, address, uint256) external pure { revert("Soulbound"); }
    function safeTransferFrom(address, address, uint256) external pure { revert("Soulbound"); }
    function safeTransferFrom(address, address, uint256, bytes calldata) external pure { revert("Soulbound"); }
}

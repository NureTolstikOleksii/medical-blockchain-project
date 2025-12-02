// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


contract MedicalData {
    address public admin;

    mapping(address => bool) public isPatient;
    mapping(address => bool) public isDoctor;

    /// @dev Структура призначення ліків
    struct Prescription {
        uint256 id;
        address patient;
        address doctor;
        string medicationName;
        string dosage;
        string schedule;
        uint256 timestamp;
        string ipfsHash;
    }

    uint256 public nextPrescriptionId = 1;

    /// @dev Зберігаємо всі призначення за ID
    mapping(uint256 => Prescription) private prescriptions;

    /// @dev Для швидкого пошуку призначень пацієнта
    mapping(address => uint256[]) private patientPrescriptionIds;

    /// @dev Права доступу: чи може конкретний лікар працювати з конкретним пацієнтом
    mapping(address => mapping(address => bool)) public patientToDoctorAccess;

    /// Події

    /// @dev Пацієнт зареєстрований на блокчейні
    event PatientRegistered(address indexed wallet);

    /// @dev Лікар зареєстрований на блокчейні
    event DoctorRegistered(address indexed wallet);

    /// @dev Адмін змінив право доступу лікаря до пацієнта
    event AccessGranted(address indexed patient, address indexed doctor, bool allowed);

    /// @dev Створено нове призначення
    event PrescriptionCreated(
        uint256 indexed id,
        address indexed patient,
        address indexed doctor,
        string medicationName
    );


    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier onlyDoctor() {
        require(isDoctor[msg.sender], "Only doctor can call this function");
        _;
    }

    modifier onlyExistingPatient(address _patient) {
        require(isPatient[_patient], "Patient is not registered");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /// @notice Реєстрація пацієнта
    function registerPatient(address _wallet) external onlyAdmin {
        require(_wallet != address(0), "Invalid wallet");
        require(!isPatient[_wallet], "Patient already registered");

        isPatient[_wallet] = true;

        emit PatientRegistered(_wallet);
    }

    /// @notice Реєстрація лікаря
    function registerDoctor(address _wallet) external onlyAdmin {
        require(_wallet != address(0), "Invalid wallet");
        require(!isDoctor[_wallet], "Doctor already registered");

        isDoctor[_wallet] = true;

        emit DoctorRegistered(_wallet);
    }

    /// @notice Адмін встановлює/знімає право лікаря працювати з пацієнтом
    function setDoctorAccess(
        address _patient,
        address _doctor,
        bool _allowed
    ) external onlyAdmin onlyExistingPatient(_patient) {
        require(isDoctor[_doctor], "Doctor not registered");

        patientToDoctorAccess[_patient][_doctor] = _allowed;

        emit AccessGranted(_patient, _doctor, _allowed);
    }

    /// @notice Транзакцію надсилає backend-relayer
    function addPrescriptionByRelayer(
        address _doctor,
        address _patient,
        string calldata _medicationName,
        string calldata _dosage,
        string calldata _schedule,
        string calldata _ipfsHash
    )
        external
        onlyAdmin
        onlyExistingPatient(_patient)
    {
        require(isDoctor[_doctor], "Doctor not registered");
        require(
            patientToDoctorAccess[_patient][_doctor],
            "Doctor has no access to this patient"
        );

        uint256 id = nextPrescriptionId++;

        prescriptions[id] = Prescription({
            id: id,
            patient: _patient,
            doctor: _doctor,
            medicationName: _medicationName,
            dosage: _dosage,
            schedule: _schedule,
            timestamp: block.timestamp,
            ipfsHash: _ipfsHash
        });

        patientPrescriptionIds[_patient].push(id);

        emit PrescriptionCreated(id, _patient, _doctor, _medicationName);
    }

    /// @notice Отримати список ID призначень для пацієнта
    function getPrescriptionsForPatient(address _patient)
        external
        view
        onlyExistingPatient(_patient)
        returns (uint256[] memory)
    {
        return patientPrescriptionIds[_patient];
    }

    /// @notice Отримати одне призначення за ID
    function getPrescription(uint256 _id)
        external
        view
        returns (
            uint256 id,
            address patient,
            address doctor,
            string memory medicationName,
            string memory dosage,
            string memory schedule,
            uint256 timestamp,
            string memory ipfsHash
        )
    {
        Prescription memory p = prescriptions[_id];
        require(p.id != 0, "Prescription does not exist");

        return (
            p.id,
            p.patient,
            p.doctor,
            p.medicationName,
            p.dosage,
            p.schedule,
            p.timestamp,
            p.ipfsHash
        );
    }
}

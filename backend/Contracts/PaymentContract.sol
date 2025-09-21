// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PaymentContract {
    enum Status { Pending, Completed }

    struct Payment {
        address sender;
        address receiver;
        uint256 amount;
        uint256 timestamp;
        Status status;
    }

    Payment[] public payments;
    address public owner;
    bool private locked; // Reentrancy guard

    event PaymentMade(address indexed sender, address indexed receiver, uint256 amount, uint256 timestamp);
    event EscrowReleased(uint256 indexed paymentIndex, address indexed receiver, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    modifier noReentrant() {
        require(!locked, "Reentrancy not allowed");
        locked = true;
        _;
        locked = false;
    }

    modifier validIndex(uint256 index) {
        require(index < payments.length, "Invalid payment index");
        _;
    }

    // Modified to take `uint256 amount` as an explicit parameter
    function makePayment(address receiver, uint256 amount, bool escrow) external payable {
        require(msg.value == amount, "Incorrect ETH amount sent");
        require(amount > 0, "Must send ETH");

        Status paymentStatus = escrow ? Status.Pending : Status.Completed;
        payments.push(Payment({
            sender: msg.sender,
            receiver: receiver,
            amount: amount,
            timestamp: block.timestamp,
            status: paymentStatus
        }));

        emit PaymentMade(msg.sender, receiver, amount, block.timestamp);

        if (!escrow) {
            payable(receiver).transfer(amount);
        }
    }

    function releaseEscrow(uint256 paymentIndex) external onlyOwner validIndex(paymentIndex) noReentrant {
        Payment storage payment = payments[paymentIndex];
        require(payment.status == Status.Pending, "Payment not pending");

        payment.status = Status.Completed;
        payable(payment.receiver).transfer(payment.amount);

        emit EscrowReleased(paymentIndex, payment.receiver, payment.amount);
    }

    function getPayment(uint256 index) external view validIndex(index) returns (Payment memory) {
        return payments[index];
    }

    function totalPayments() external view returns (uint256) {
        return payments.length;
    }
}

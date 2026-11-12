// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SKYLINE Booking Ledger
/// @notice Stores minimal ticket verification data on-chain. Never store passenger PII here.
contract SkylineBookingLedger {
    struct BookingRecord {
        string bookingRef;
        string flightId;
        string seatNumber;
        address wallet;
        uint64 recordedAt;
        bool exists;
        bool cancelled;
    }

    mapping(bytes32 => BookingRecord) private recordsByRef;
    mapping(bytes32 => bool) private occupiedSeats;
    event BookingRecorded(bytes32 indexed bookingRefHash, string bookingRef, string flightId, string seatNumber, address indexed wallet, uint64 recordedAt);
    event BookingCancelled(bytes32 indexed bookingRefHash, string bookingRef, address indexed wallet, uint64 recordedAt);

    function recordBooking(string calldata bookingRef, string calldata flightId, string calldata seatNumber) external {
        require(bytes(bookingRef).length > 0, "Booking reference required");
        require(bytes(flightId).length > 0, "Flight ID required");
        require(bytes(seatNumber).length > 0, "Seat number required");
        bytes32 refHash = keccak256(bytes(bookingRef));
        require(!recordsByRef[refHash].exists, "Booking reference already recorded");
        bytes32 seatKey = keccak256(abi.encodePacked(flightId, "|", seatNumber));
        require(!occupiedSeats[seatKey], "Seat already recorded as booked");
        occupiedSeats[seatKey] = true;
        recordsByRef[refHash] = BookingRecord(bookingRef, flightId, seatNumber, msg.sender, uint64(block.timestamp), true, false);
        emit BookingRecorded(refHash, bookingRef, flightId, seatNumber, msg.sender, uint64(block.timestamp));
    }

    function recordCancellation(string calldata bookingRef) external {
        bytes32 refHash = keccak256(bytes(bookingRef));
        BookingRecord storage item = recordsByRef[refHash];
        require(item.exists, "Booking not found");
        require(item.wallet == msg.sender, "Only booking wallet can cancel on-chain");
        require(!item.cancelled, "Already cancelled");
        item.cancelled = true;
        occupiedSeats[keccak256(abi.encodePacked(item.flightId, "|", item.seatNumber))] = false;
        emit BookingCancelled(refHash, bookingRef, msg.sender, uint64(block.timestamp));
    }

    function getBooking(string calldata bookingRef) external view returns (string memory, string memory, string memory, address, uint64, bool, bool) {
        BookingRecord memory item = recordsByRef[keccak256(bytes(bookingRef))];
        require(item.exists, "Booking not found");
        return (item.bookingRef, item.flightId, item.seatNumber, item.wallet, item.recordedAt, item.exists, item.cancelled);
    }

    function verifyBooking(string calldata bookingRef) external view returns (bool) {
        return recordsByRef[keccak256(bytes(bookingRef))].exists;
    }
}

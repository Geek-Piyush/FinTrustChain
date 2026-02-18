import mongoose from "mongoose";
import User from "../models/userModel.js";
import Endorsement from "../models/endorsementModel.js";
import * as trustIndexService from "../services/trustIndexService.js";
import * as userService from "../services/userService.js";
import AppError from "../utils/AppError.js";

// POST /endorsements
// NOTE: Keeps manual try/catch because of DB session with abort on error
export const createEndorsement = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const endorser = req.user;
    const { receiverId } = req.body;

    // --- 1. Validation and Business Rules ---
    if (endorser.id === receiverId) {
      throw new AppError("You cannot endorse yourself.", 400);
    }

    // --- 2. Check for existing endorsement relationship ---
    const existingEndorsement = await Endorsement.findOne({
      endorser: endorser.id,
      receiver: receiverId,
    }).session(session);

    if (existingEndorsement) {
      if (existingEndorsement.status === "ACTIVE") {
        throw new AppError("You have already endorsed this user.", 409);
      } else if (existingEndorsement.status === "REMOVED") {
        throw new AppError(
          "You cannot re-endorse a user after removing a previous endorsement.",
          409,
        );
      }
    }

    // --- 3. "4 Endorsers Per Month" Rule  ---
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const endorsementCount = await Endorsement.countDocuments({
      endorser: endorser.id,
      status: "ACTIVE",
      createdAt: { $gte: oneMonthAgo },
    }).session(session);

    if (endorsementCount >= 4) {
      throw new AppError(
        "You can only endorse a maximum of 4 users per month.",
        400,
      );
    }

    // --- 4. Calculate TI Gain and Update Users ---
    const receiver = await User.findById(receiverId).session(session);
    if (!receiver)
      throw new AppError(
        "The user you are trying to endorse does not exist.",
        404,
      );

    const tiGain = trustIndexService.getInitialEndorsementGain(
      receiver.trustIndex,
    );
    await userService.updateTrustIndex(
      receiver,
      tiGain,
      "Received Endorsement",
    );
    receiver.endorsementsReceived.push(endorser.id);
    endorser.endorsementsGiven.push(receiver.id);

    // --- 5. Save All Changes ---
    await receiver.save({ session });
    await endorser.save({ session });
    await Endorsement.create(
      [{ endorser: endorser.id, receiver: receiver.id, status: "ACTIVE" }],
      { session },
    );

    await session.commitTransaction();
    res
      .status(201)
      .json({ status: "success", message: "Endorsement successful." });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// DELETE /endorsements/:id
// NOTE: Keeps manual try/catch because of DB session with abort on error
export const removeEndorsement = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const endorser = req.user;
    const receiverId = req.params.id;

    // --- 1. Find the ACTIVE endorsement to remove ---
    const endorsement = await Endorsement.findOne({
      endorser: endorser.id,
      receiver: receiverId,
      status: "ACTIVE",
    }).session(session);

    if (!endorsement) {
      throw new AppError(
        "You do not have an active endorsement for this user.",
        404,
      );
    }

    // --- 2. Calculate TI Loss and Update Users ---
    const receiver = await User.findById(receiverId).session(session);
    if (!receiver)
      throw new AppError(
        "The user you are trying to un-endorse does not exist.",
        404,
      );

    const tiLoss = trustIndexService.getInitialEndorsementLoss(
      receiver.trustIndex,
    );
    receiver.trustIndex -= tiLoss;

    endorser.endorsementsGiven.pull(receiverId);
    receiver.endorsementsReceived.pull(endorser.id);

    // --- 3. Update Endorsement Status ---
    endorsement.status = "REMOVED";

    // --- 4. Save All Changes ---
    await receiver.save({ session });
    await endorser.save({ session });
    await endorsement.save({ session });

    await session.commitTransaction();
    res.status(200).json({
      status: "success",
      message: "Endorsement removed successfully.",
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

import User from "../models/userModel.js";
import Contract from "../models/contractModel.js";
import PlatformRevenue from "../models/platformRevenueModel.js";
import LoanBrochure from "../models/loanBrochureModel.js";

// ── Dashboard Stats ──
export const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalContracts,
      activeContracts,
      premiumUsers,
      revenueAgg,
    ] = await Promise.all([
      User.countDocuments(),
      Contract.countDocuments(),
      Contract.countDocuments({
        status: { $in: ["ACTIVE", "AWAITING_DISBURSAL", "AWAITING_RECEIPT_CONFIRMATION"] },
      }),
      User.countDocuments({ "premium.active": true }),
      PlatformRevenue.aggregate([
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Build revenue breakdown
    const revenue = {
      total: 0,
      PLATFORM_FEE: { total: 0, count: 0 },
      CONVENIENCE_FEE: { total: 0, count: 0 },
      SUBSCRIPTION: { total: 0, count: 0 },
    };
    for (const r of revenueAgg) {
      revenue[r._id] = { total: r.total, count: r.count };
      revenue.total += r.total;
    }

    // This month's revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthRevenue = await PlatformRevenue.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        totalUsers,
        totalContracts,
        activeContracts,
        premiumUsers,
        revenue,
        thisMonthRevenue: thisMonthRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Revenue List ──
export const getRevenue = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20, startDate, endDate } = req.query;
    const query = {};

    if (type) query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [entries, total] = await Promise.all([
      PlatformRevenue.find(query)
        .populate("user", "name email")
        .populate("contract", "contractId principal")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      PlatformRevenue.countDocuments(query),
    ]);

    res.status(200).json({
      status: "success",
      results: entries.length,
      totalPages: Math.ceil(total / Number(limit)),
      data: { entries },
    });
  } catch (error) {
    next(error);
  }
};

// ── User Management ──
export const getUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20, sort = "-createdAt" } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select("name email trustIndex currentRole status premium lenderCapital lockedCapital createdAt")
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      status: "success",
      results: users.length,
      totalPages: Math.ceil(total / Number(limit)),
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

export const blockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new Error("User not found.");

    user.status = user.status === "BLOCKED" ? "ACTIVE" : "BLOCKED";
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      message: `User ${user.status === "BLOCKED" ? "blocked" : "unblocked"} successfully.`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// ── Contract Management ──
export const getContracts = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) query.contractId = { $regex: search, $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);

    const [contracts, total] = await Promise.all([
      Contract.find(query)
        .populate("lender", "name email")
        .populate("receiver", "name email")
        .populate("guarantor", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Contract.countDocuments(query),
    ]);

    res.status(200).json({
      status: "success",
      results: contracts.length,
      totalPages: Math.ceil(total / Number(limit)),
      data: { contracts },
    });
  } catch (error) {
    next(error);
  }
};

export const getContractById = async (req, res, next) => {
  try {
    // Search by contractId string OR ObjectId
    const contract = await Contract.findOne({
      $or: [
        { contractId: req.params.contractId },
        ...(req.params.contractId.match(/^[0-9a-fA-F]{24}$/)
          ? [{ _id: req.params.contractId }]
          : []),
      ],
    })
      .populate("lender", "name email trustIndex")
      .populate("receiver", "name email trustIndex")
      .populate("guarantor", "name email trustIndex");

    if (!contract) throw new Error("Contract not found.");

    res.status(200).json({
      status: "success",
      data: { contract },
    });
  } catch (error) {
    next(error);
  }
};

export const updateContractStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "PENDING_SIGNATURES",
      "AWAITING_DISBURSAL",
      "AWAITING_RECEIPT_CONFIRMATION",
      "ACTIVE",
      "REPAID",
      "DEFAULT",
    ];

    if (!status || !validStatuses.includes(status)) {
      throw new Error(`Status must be one of: ${validStatuses.join(", ")}`);
    }

    const contract = await Contract.findById(req.params.id);
    if (!contract) throw new Error("Contract not found.");

    const previousStatus = contract.status;
    contract.status = status;
    await contract.save();

    res.status(200).json({
      status: "success",
      message: `Contract status changed from ${previousStatus} to ${status}.`,
      data: { contract },
    });
  } catch (error) {
    next(error);
  }
};

// ── Revenue Chart Data (monthly) ──
export const getRevenueChart = async (req, res, next) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const chartData = await PlatformRevenue.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            type: "$type",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.status(200).json({
      status: "success",
      data: { chartData },
    });
  } catch (error) {
    next(error);
  }
};

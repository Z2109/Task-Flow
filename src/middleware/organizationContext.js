
import mongoose from "mongoose";
import Organization from "../models/organizationModel.js";
import OrganizationMember from "../models/organizationMemberModel.js";

const organizationContext = async (req, res, next) => {
  try {
    const organizationId = req.headers["x-organization-id"];
    const userId = req.userId;

    // Check authentication
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check organization ID
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.isValidObjectId(organizationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization ID",
      });
    }

    // Find active organization
    const organization = await Organization.findOne({
      _id: organizationId,
      isActive: true,
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found or inactive",
      });
    }

    // Check organization membership
    const membership = await OrganizationMember.findOne({
      user: userId,
      organization: organizationId,
      status: "active",
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not an active member of this organization",
      });
    }

    // Attach organization details
    req.organizationId = organization._id.toString();
    req.organization = organization;
    req.organizationMembership = membership;

    next();
  } catch (error) {
    next(error);
  }
};

export default organizationContext;

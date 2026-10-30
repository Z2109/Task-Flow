
import mongoose from "mongoose";
import authorizationService from "../services/authorizationService.js";

const authorizePermission = (permission) => {
    return async (req, res, next) => {
        try {
            // 1. Check authentication
            const userId = req.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
            }

            if (!mongoose.isValidObjectId(userId)) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid authenticated user",
                });
            }

            // 2. Validate the permission configured on the route
            if (
                typeof permission !== "string" ||
                !permission.trim()
            ) {
                return res.status(500).json({
                    success: false,
                    message: "Invalid permission configuration",
                });
            }

            // 3. Check organization context
            const organizationId = req.organizationId;

            if (!organizationId) {
                return res.status(400).json({
                    success: false,
                    message: "Organization context is required",
                });
            }

            if (!mongoose.isValidObjectId(organizationId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid organization ID",
                });
            }

            // 4. Resolve project ID from supported route locations
            const projectId =
                req.params?.projectId ||
                req.params?.id ||
                req.body?.projectId ||
                req.query?.projectId ||
                req.projectId ||
                null;

            if (
                projectId !== null &&
                !mongoose.isValidObjectId(projectId)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid project ID",
                });
            }

            // 5. Check authorization
            const allowed = await authorizationService.can({
                userId,
                organizationId,
                projectId,
                permission,
            });

            if (!allowed) {
                return res.status(403).json({
                    success: false,
                    message: "You do not have permission to perform this action",
                });
            }

            // 6. Continue to the controller
            return next();
        } catch (error) {
            return next(error);
        }
    };
};

export default authorizePermission;

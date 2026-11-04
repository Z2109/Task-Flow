
import mongoose from "mongoose";
import authorizationService from "../services/authorizationService.js";

const authorizePermission = (permission) => {
  return async (req, res, next) => {
    try {
      // 1. Validate authenticated user
      const userId = req.userId;

      if (!userId || !mongoose.isValidObjectId(userId)) {
        return res.status(401).json({
          success: false,
          message: "Authentication required or invalid user",
        });
      }

      // 2. Validate permission key
      if (
        typeof permission !== "string" ||
        !permission.trim()
      ) {
        return res.status(500).json({
          success: false,
          message: "Invalid permission configuration",
        });
      }

      // 3. Validate organization context
      const organizationId = req.organizationId;

      if (
        !organizationId ||
        !mongoose.isValidObjectId(organizationId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid organization context is required",
        });
      }

      // 4. Resolve project context
      const taskProject =
        req.task?.project;

      const taskProjectId =
        taskProject?._id || taskProject || null;

      const projectId =
        taskProjectId ||
        req.projectId ||
        req.params?.projectId ||
        req.body?.projectId ||
        req.query?.projectId ||
        null;

      // Validate project ID only when supplied
      if (
        projectId !== null &&
        !mongoose.isValidObjectId(projectId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid project ID",
        });
      }

      // 5. Verify authorization service
      if (
        !authorizationService ||
        typeof authorizationService.can !== "function"
      ) {
        console.error(
          "Authorization service is incorrectly imported or exported"
        );

        return res.status(500).json({
          success: false,
          message: "Authorization service configuration error",
        });
      }

      // 6. Debug authorization request
      console.log("\n========== AUTHORIZATION CHECK ==========");
      console.log({
        userId: String(userId),
        organizationId: String(organizationId),
        projectId: projectId ? String(projectId) : null,
        permission,
        method: req.method,
        url: req.originalUrl,
      });

      // 7. Check permission
      const allowed = await authorizationService.can({
        userId,
        organizationId,
        projectId,
        permission,
      });

      console.log(
        "AUTHORIZATION RESULT:",
        allowed ? "GRANTED" : "DENIED"
      );

      console.log("========== AUTHORIZATION END ==========\n");

      // 8. Deny access
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to perform this action",
          requiredPermission: permission,
        });
      }

      // 9. Continue to controller
      return next();

    } catch (error) {
      console.error(
        "Authorization Middleware Error:",
        error
      );

      return next(error);
    }
  };
};

export default authorizePermission;

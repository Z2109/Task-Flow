
import ActivityLog from "../models/activityLogModel.js";

const logActivity = async ({
    organization,
    user,
    action,
    entityType,
    entityId,
    description,
}) => {
    return ActivityLog.create({
        organization,
        user,
        action,
        entityType,
        entityId,
        description,
    });
};

export default logActivity;

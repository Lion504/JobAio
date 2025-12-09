import OriginalJob from "../../../../packages/db/src/models/OriginalJob.js";

// GET /api/jobs/stats
export const getJobStatsController = async (req, res, next) => {
  try {
    const totalJobs = await OriginalJob.countDocuments();

    // Aggregate top skills
    const topSkills = await OriginalJob.aggregate([
      { $unwind: "$skill_type.technical" },
      { $group: { _id: "$skill_type.technical", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      {
        $project: {
          label: "$_id",
          count: 1,
          percentage: { $round: [{ $multiply: [{ $divide: ["$count", totalJobs] }, 100] }, 1] }
        }
      }
    ]);

    // Aggregate language requirements
    const languages = await OriginalJob.aggregate([
      { $project: { 
          hasEnglish: { $in: ["English", { $ifNull: ["$language.required", []] }] },
          hasFinnish: { $in: ["Finnish", { $ifNull: ["$language.required", []] }] },
          hasSwedish: { $in: ["Swedish", { $ifNull: ["$language.required", []] }] }
        } 
      },
      {
        $group: {
          _id: null,
          English: { $sum: { $cond: ["$hasEnglish", 1, 0] } },
          Finnish: { $sum: { $cond: ["$hasFinnish", 1, 0] } },
          Swedish: { $sum: { $cond: ["$hasSwedish", 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          stats: [
            { label: "English", count: "$English", percentage: { $round: [{ $multiply: [{ $divide: ["$English", totalJobs] }, 100] }, 1] } },
            { label: "Finnish", count: "$Finnish", percentage: { $round: [{ $multiply: [{ $divide: ["$Finnish", totalJobs] }, 100] }, 1] } },
            { label: "Swedish", count: "$Swedish", percentage: { $round: [{ $multiply: [{ $divide: ["$Swedish", totalJobs] }, 100] }, 1] } }
          ]
        }
      }
    ]);

    // Aggregate experience levels
    const experienceDistribution = await OriginalJob.aggregate([
      { $group: { _id: "$experience_level", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
       {
        $project: {
          label: { $ifNull: ["$_id", "Pro"] }, // Default to Pro if null/unknown
          count: 1,
          percentage: { $round: [{ $multiply: [{ $divide: ["$count", totalJobs] }, 100] }, 1] }
        }
      }
    ]);

    // Aggregate education levels
    const educationDistribution = await OriginalJob.aggregate([
      { $unwind: { path: "$education_level", preserveNullAndEmptyArrays: true } }, // Some jobs might not have education
      { $group: { _id: "$education_level", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          label: { $ifNull: ["$_id", "Bachelors"] }, // Default to Bachelors if null/unknown
          count: 1,
          percentage: { $round: [{ $multiply: [{ $divide: ["$count", totalJobs] }, 100] }, 1] }
        }
      }
    ]);


    const stats = {
      totalJobs,
      topSkills: topSkills || [],
      languages: languages[0]?.stats || [],
      experienceDistribution: experienceDistribution || [],
      educationDistribution: educationDistribution || []
    };

    return res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

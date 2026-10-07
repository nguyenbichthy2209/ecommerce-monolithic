const prisma = require("../config/prisma");

const getMyMembership = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        uid: req.user.uid
      },
      include: {
        membership: true
      }
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json({
      uid: user.uid,
      username: user.username,
      membership: user.membership
    });

  } catch (error) {
    console.error("GET MEMBERSHIP ERROR:", error);

    res.status(500).json({
      message: "Cannot get membership"
    });
  }
};

module.exports = {
  getMyMembership
};
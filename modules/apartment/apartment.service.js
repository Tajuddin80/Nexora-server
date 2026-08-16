const Apartment = require("../../models/Apartment");

const getApartmentsFromDB = async (queryFilters) => {
  const page = parseInt(queryFilters.page) || 1;
  const limit = parseInt(queryFilters.limit) || 8;
  const skip = (page - 1) * limit;

  const minRent = parseInt(queryFilters.minRent) || 0;
  const maxRent = parseInt(queryFilters.maxRent) || 9999999;

  const sortBy = queryFilters.sortBy || "rent";
  const sortOrder = queryFilters.sortOrder === "desc" ? -1 : 1;

  const query = {
    rent: { $gte: minRent, $lte: maxRent },
  };

  const total = await Apartment.countDocuments(query);
  const apartments = await Apartment.find(query)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);

  return {
    total,
    page,
    pages: Math.ceil(total / limit),
    apartments,
  };
};

module.exports = {
  getApartmentsFromDB,
};

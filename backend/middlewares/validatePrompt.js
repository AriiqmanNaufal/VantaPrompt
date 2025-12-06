module.exports = (req, _res, next) => {
  // Ensure request payload includes a prompt field before hitting controllers
  req.prompt = req.body?.prompt ?? "";
  next();
};

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value.toLowerCase();

        let user = await User.findOne({
          where: { email: email },
        });

        if (user) {
          // If user registered locally before, upgrade to Google
          if (user.provider !== "google") {
            user.provider = "google";
            user.provider_id = profile.id;
            user.password = null;
            user.isVerified = true;
            await user.save();
          }

          return done(null, user);
        }

        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            provider: "google",
            password: null,
            provider_id: profile.id,
            isVerified: true,
            role: "user",
          });
        }

        return done(null, user);
      } catch (err) {
        console.error(err);
        return done(err, null);
      }
    },
  ),
);

module.exports = passport;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        if (!profile.emails || profile.emails.length === 0) {
          return done(new Error("No email returned from Google"), null);
        }

        const email = profile.emails[0].value.toLowerCase();

        let user = await User.findOne({ where: { email } });

        if (user) {
          if (user.provider !== "google") {
            user.provider = "google";
            user.provider_id = profile.id;
            user.password = null;
            user.isVerified = true;
            await user.save();
          }

          return done(null, user);
        }

        user = await User.create({
          name: profile.displayName,
          email: email,
          provider: "google",
          password: null,
          provider_id: profile.id,
          isVerified: true,
          role: "user",
        });

        return done(null, user);
      } catch (err) {
        console.error("Google Strategy Error:", err);
        return done(err, null);
      }
    },
  ),
);

module.exports = passport;

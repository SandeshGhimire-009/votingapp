const express = require('express');
const cors = require('cors');
const { connect } = require('mongoose');

require('dotenv').config();

const Routes = require('./routes/Routes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { seedMongoIfEmpty } = require('./utils/seedMongo');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(
  cors({
    credentials: true,
    origin: true,
  })
);

app.use('/api', Routes);
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const mongoUrl = process.env.MONGO_URL;
if (!mongoUrl) {
  console.error('MONGO_URL is required. Server will not start without MongoDB.');
  process.exit(1);
}

connect(mongoUrl)
  .then(async () => {
    await seedMongoIfEmpty();
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB', err);
    process.exit(1);
  });
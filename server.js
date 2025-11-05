const express = require('express');
const mongoose = require('mongoose');
const purchasesRouter = require('./routes/purchases');
const salesRouter = require('./routes/sales');

const app = express();
app.use(express.json());

// Connect to MongoDB first (example)
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/yourdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(()=> console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error', err));

// use routers
app.use('/api/purchases', purchasesRouter);
app.use('/api/sales', salesRouter);

// error handler & listen...
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server listening on ${PORT}`));

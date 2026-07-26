const MasterData = require('../models/MasterData');

exports.getAllMasterData = async (req, res) => {
  try {
    const data = await MasterData.find();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching master data', error: error.message });
  }
};

exports.createMasterData = async (req, res) => {
  try {
    const { category, value, description } = req.body;
    if (!category || !value) {
      return res.status(400).json({ message: 'Category and value are required' });
    }
    const newData = new MasterData({ category, value, description });
    await newData.save();
    res.status(201).json(newData);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating master data', error: error.message });
  }
};

exports.updateMasterData = async (req, res) => {
  try {
    const { id } = req.params;
    const { value, description, isActive } = req.body;
    
    const updated = await MasterData.findByIdAndUpdate(
      id,
      { value, description, isActive },
      { new: true, runValidators: true }
    );
    
    if (!updated) {
      return res.status(404).json({ message: 'Master data not found' });
    }
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating master data', error: error.message });
  }
};

exports.deleteMasterData = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MasterData.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Master data not found' });
    }
    res.json({ message: 'Master data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting master data', error: error.message });
  }
};

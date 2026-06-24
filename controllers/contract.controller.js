const { 
  createContract: createContractInDb, 
  getUserContracts, 
  getContractById, 
  countUserContracts 
} = require('../services/firebase.service');
const { generateContractPDF, generateHTMLTemplate } = require('../services/pdf.service');

async function listContracts(req, res) {
  try {
    const contracts = await getUserContracts(req.userId);
    res.json({ contracts });
  } catch (error) {
    console.error('Contract list error:', error);
    res.status(500).json({ error: 'Error while fetching contracts' });
  }
}

async function createContract(req, res) {
  try {
    const contractData = {
      userId: req.userId,
      type: req.body.type || 'prestation',
      prestataire: req.body.prestataire,
      client: req.body.client,
      mission: req.body.mission,
      price: req.body.price || 0,
      currency: req.body.currency || 'EUR',
      clauses: req.body.clauses || []
    };

    const contractDoc = await createContractInDb(contractData);
    const contract = { id: contractDoc.id, ...contractDoc.data() };

    res.status(201).json({ 
      message: 'Contract created successfully',
      contract 
    });
  } catch (error) {
    console.error('Contract creation error:', error);
    res.status(500).json({ error: 'Error while creating contract' });
  }
}

async function getContract(req, res) {
  try {
    const { id } = req.params;
    const contract = await getContractById(id);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (contract.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden access' });
    }

    res.json({ contract });
  } catch (error) {
    console.error('Contract fetch error:', error);
    res.status(500).json({ error: 'Error while fetching contract' });
  }
}

async function generatePDF(req, res) {
  try {
    const { id } = req.params;
    const contract = await getContractById(id);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (contract.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden access' });
    }

    const userPlan = req.userPlan || 'basic';
    const pdfBytes = await generateContractPDF(contract, userPlan);

    res.setHeader('Content-Type', 'application/pdf');
    const filenameClient = (contract.client?.nom || 'contrat').replace(/[^a-zA-Z0-9-_]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameClient}-${id}.pdf"`);
    const buffer = Buffer.from(pdfBytes);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Error while generating PDF' });
  }
}
async function previewContract(req, res) {
  try {
    const { id } = req.params;
    const contract = await getContractById(id);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (contract.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden access' });
    }

    const userPlan = req.userPlan || 'basic';
    const html = await generateHTMLTemplate(contract, userPlan);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Preview generation error:', error);
    res.status(500).json({ error: 'Error while generating preview' });
  }
}

module.exports = {
  listContracts,
  createContract: createContract,
  getContract,
  generatePDF,
  previewContract
};

const express = require('express');
const middlewares = require('../helpers/middlewares');
const Article = require('../models/article');
const Logger = require('../models/log');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.hasFullReadAccess);

/* GET documentation index */
router.get('/', async (req, res) => {
    const articles = await Article.find({ type: 'documentation' });

    articles.sort((a, b) => {
        return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
    });

    res.json(articles.map(article => ({
        title: article.title,
        slug: article.slug,
    })));
});

/* GET documentation article */
router.get('/:slug', async (req, res) => {
    const article = await Article.findByTitle(req.params.slug);

    if (!article) {
        return res.json({ error: 'article not found' });
    }
    
    res.json(article);
});

/* POST edit documentation article */
router.post('/:slug/edit', middlewares.isNat, async (req, res) => {
    const article = await Article.findByTitle(req.params.slug);

    if (!article) {
        return res.json({ error: 'article not found' });
    }

    article.title = req.body.title;
    article.content = req.body.content;
    await article.save();

    res.json(article);

    Logger.generate(
        req.session.mongoId,
        `Edited article "${article.title}"`,
        'documentation',
        null
    );
});

/* POST create documentation article */
router.post('/create', middlewares.isAdmin, async (req, res) => {
    const existingArticle = await Article.findByTitle(req.body.title);

    if (existingArticle) {
        return res.json({ error: 'article already exists' });
    }

    const article = new Article({
        title: req.body.title,
        content: req.body.content,
    });

    await article.save();

    res.json(article);

    Logger.generate(
        req.session.mongoId,
        `Created article "${article.title}"`,
        'documentation',
        null
    );
});

module.exports = router;

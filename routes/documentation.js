const express = require('express');
const middlewares = require('../helpers/middlewares');
const Article = require('../models/article');

const router = express.Router();

router.use(middlewares.isLoggedIn);
router.use(middlewares.hasFullReadAccess);

/* GET documentation index */
router.get('/', async (req, res) => {
    const articles = await Article.find({ type: 'documentation' }).sort({ title: 1 });

    res.json(articles.map(article => ({
        title: article.title,
        slug: article.slug,
    })));
});

/* GET documentation article */
router.get('/:slug', async (req, res) => {
    console.log(req.params.slug);
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
});

/* POST create documentation article */
router.post('/create', middlewares.isResponsibleWithButtons, async (req, res) => {
    const existingArticle = await Article.findByTitleOrId(req.body.title);

    if (existingArticle) {
        return res.status(409).json({ error: 'article already exists' });
    }

    const article = new Article({
        title: req.body.title,
        content: req.body.content,
    });

    await article.save();

    res.json(article);
});

module.exports = router;

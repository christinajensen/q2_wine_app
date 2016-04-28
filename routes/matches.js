const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const matching = require('../helpers/matching');
const auth = require('../helpers/authHelpers');

router.get('/', (req, res) => {
  knex('matches').then(matches => {
    res.render('matches/index', {matches});
  });
});

router.get('/new', (req, res) => {
  res.render('matches/new', {error: req.flash('error')});
});

router.get('/:id', (req, res) => {
  knex('matches').where('id', req.params.id).first().then(match => {
    knex('wines').where('id', match.wine_id).first().then( wine => {
      delete wine.id;
      Object.assign(match, wine);
      res.render('matches/show', {match, error: req.flash('error')});
    });
  });
});

router.post('/', (req, res) => {
  if (!Object.keys(req.body).length){
    req.flash('error', 'You must select at least one item.');
    res.redirect('/matches/new');
  }
  var choices = req.body.matches;
  var wine = matching.wineMatch(choices.veggie, choices.cheese, choices.meat, choices.dessert);
  knex('wines').where('name', wine).first().then(wine => {
    choices.wine_id = wine.id;
    knex('matches').insert(choices, '*').then(pairing => {
      res.redirect(`/matches/${pairing[0].id}`);
    });
  });
});

router.post('/:id', auth.ensureFavorite, (req, res) => {
  var user = res.locals.currentUser;

  knex('users_favs').insert({user_id: user.id, match_id: req.params.id}).then(() => {
    res.redirect(`/users/${user.id}`);
  });
});

router.delete('/:id', (req, res) => {
  knex('matches').where('id', req.params.id).returning('*').del().then(match => {
    res.redirect(`/users/${match.user_id}`);
  });
});

module.exports = router;
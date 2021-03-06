# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-01-12 22:22
# flake8: noqa
from __future__ import unicode_literals

import django.contrib.postgres.fields.jsonb
from django.db import migrations, models
import django.db.models.deletion
import normandy.recipes.fields


class Migration(migrations.Migration):

    dependencies = [
        ('recipes', '0002_auto_20151231_1952'),
    ]

    operations = [
        migrations.CreateModel(
            name='Action',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True)),
                ('implementation', models.TextField()),
                ('implementation_hash', normandy.recipes.fields.AutoHashField('implementation', unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='RecipeAction',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('arguments', django.contrib.postgres.fields.jsonb.JSONField(default=dict)),
                ('action', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='recipes.Action')),
            ],
        ),
        migrations.RenameField(
            model_name='recipe',
            old_name='filename',
            new_name='name',
        ),
        migrations.RemoveField(
            model_name='recipe',
            name='content',
        ),
        migrations.RemoveField(
            model_name='recipe',
            name='content_hash',
        ),
        migrations.AddField(
            model_name='recipeaction',
            name='recipe',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='recipes.Recipe'),
        ),
        migrations.AddField(
            model_name='recipe',
            name='actions',
            field=models.ManyToManyField(related_name='recipes', through='recipes.RecipeAction', to='recipes.Action'),
        ),
    ]

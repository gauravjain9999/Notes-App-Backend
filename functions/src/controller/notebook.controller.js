
const express = require("express");
const Notebook = require("../models/notebook.model");
const logger = require('../utils/logger');
const formatTime = require("../utils/formatTime");

module.exports = {
    getNotebook: async (req, res) => {
        try {
            logger.info('GET /notebook route accessed');

            const notebooks = await Notebook.find().lean();

            const formattedNotebooks = notebooks.map(nb => ({
                ...nb,
                updatedAt: formatTime(nb.updatedAt),
                children: nb.children.map(child => ({
                    ...child,
                    updatedAt: formatTime(child.updatedAt)  // format child updatedAt
                }))
            }));

            res.status(200).json({
                apiResponseData: {
                    notebook: formattedNotebooks
                },
                apiResponseStatus: true,
            });
        }
        catch (error) {
            logger.error('Error fetching notebooks:', error);
            res.status(500).json({
                apiResponseData: {
                    apiResponseMessage: error.message,
                },
                apiResponseStatus: false,
            });
        }
    },

    updateNoteBook: async (req, res) => {
        try {
            logger.info('PATCH /notebook route accessed');
            const notebook = await Notebook.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            );
            res.status(200).json({
                apiResponseData: {
                    apiResponseMessage: "Notebook updated successfully",
                },
                apiResponseStatus: true,
            });
        } catch (error) {
            logger.error('Error updating notebook:', error);
            res.status(500).json({
                apiResponseData: {
                    apiResponseMessage: error.message,
                },
                apiResponseStatus: false,
            });
        }
    },

    createNotebook: async (req, res) => {
        try {
            logger.info('POST /notebook route accessed');
            console.log(req.body.children);
            const notebook = new Notebook({
                title: req.body.title,
                createdAt: req.userData.email,   // Gmail ID here
                children: (req.body.children || []).map(child => ({
                    title: child.title,
                    createdAt: req.userData.email,
                    updatedAt: Date.now()  // ALWAYS Gmail for children
                }))               // initialize empty
            });

            if (!notebook) return res.status(404).json({
                apiResponseData: {
                    apiResponseMessage: "Notebook not found"
                },
                apiResponseStatus: false
            });
            await notebook.save();
            res.status(200).json({
                apiResponseData: {
                    apiResponseMessage: 'Notebook created Successfully',
                },
                apiResponseStatus: true,
            });
        } catch (error) {
            logger.error('Error creating notebook:', error);
            res.status(500).json({
                apiResponseData: {
                    apiResponseMessage: error.message,
                },
                apiResponseStatus: false,
            });
        }
    },

    deleteNoteBook: async (req, res) => {
        try {
            logger.info('DELETE /notebook route accessed');
            await Notebook.findByIdAndDelete(req.params.id);
            res.status(200).json({
                apiResponseData: {
                    apiResponseMessage: 'Notebook deleted Successfully',
                },
                apiResponseStatus: true,
            });
        } catch (error) {
            logger.error('Error deleting notebook:', error);
            res.status(500).json({
                apiResponseData: {
                    apiResponseMessage: error.message,
                },
                apiResponseStatus: false,
            });
        }
    }

};
import { Router } from "express";
const router = Router();
import { ObjectId } from "mongodb";
import {
  createApp,
  createMed,
  getPet,
  createPet,
  createPres,
  deleteApp,
  deleteMed,
  deletePet,
  deletePres,
  getAllPets,
  updatePet,
} from "../data/pet.js";
import xss from "xss";
import { badRequestError } from "../helpers/wrappers.js";
import client from "../config/redisClient.js";

router.route("/mypet/:userId/:petId").get(async (req, res) => {
  try {
    let userId = xss(req.params.userId);
    let petId = xss(req.params.petId);

    if (!ObjectId.isValid(userId) || !ObjectId.isValid(petId)) throw badRequestError('Invalid object ID');

    let data = await getPet(userId, petId);
    res.status(200).send(data);
  } catch (e) {
    res.status(400).send({ error: e });
  }
});

router
  .route("/medication")
  .post(async (req, res) => {
    try {
      let input = req.body;
      let userId = xss(input.userId);
      let petId = xss(input.petId);
      let medicationName = xss(input.medicationName);
      let administeredDate = xss(input.administeredDate);
      let dosage = xss(input.dosage);

      if (!ObjectId.isValid(userId) || !ObjectId.isValid(petId)) throw badRequestError('Invalid object ID');

      if (!medicationName || !administeredDate || !dosage || !Date.parse(administeredDate)) {
        throw badRequestError('Invalid input');
      }

      let data = await createMed(
        userId,
        petId,
        medicationName,
        administeredDate,
        dosage
      );
      res.status(200).send(data);
    } catch (e) {
      res.status(400).send({ error: e });
    }
  })
  .delete(async (req, res) => {
    try {
      let input = req.body;
      let userId = xss(input.userId);
      let petId = xss(input.petId);
      let medId = xss(input.medId);

      let data = await deleteMed(userId, petId, medId);
      res.status(200).send(data);
    } catch (e) {
      res.status(404).send({ error: e });
    }
  });

router
  .route("/appointment")
  .post(async (req, res) => {
    try {
      let input = req.body;
      let userId = xss(input.userId);
      let petId = xss(input.petId);
      let appointmentDate = xss(input.appointmentDate);
      let reason = xss(input.reason);
      let clinicName = xss(input.clinicName);

      if (!ObjectId.isValid(userId) || !ObjectId.isValid(petId)) throw badRequestError('Invalid object ID');

      if (!appointmentDate || !reason || !clinicName || !Date.parse(appointmentDate)) {
        throw badRequestError('Invalid input');
      }

      let data = await createApp(
        userId,
        petId,
        appointmentDate,
        reason,
        clinicName
      );
      res.status(200).send(data);
    } catch (e) {
      res.status(400).send({ error: e });
    }
  })
  .delete(async (req, res) => {
    try {
      let input = req.body;
      let userId = xss(input.userId);
      let petId = xss(input.petId);
      let appId = xss(input.appId);

      let data = await deleteApp(userId, petId, appId);
      res.status(200).send(data);
    } catch (e) {
      res.status(404).send({ error: e });
    }
  });

router
  .route("/prescription")
  .post(async (req, res) => {
    try {
      let input = req.body;
      let userId = xss(input.userId);
      let petId = xss(input.petId);
      let imageUrl = xss(input.imageUrl);

      if (!ObjectId.isValid(userId) || !ObjectId.isValid(petId)) throw badRequestError('Invalid object ID');

      if (!imageUrl) {
        throw badRequestError('Invalid input');
      }

      let data = await createPres(userId, petId, imageUrl);
      res.status(200).send(data);
    } catch (e) {
      res.status(400).send({ error: e });
    }
  })
  .delete(async (req, res) => {
    try {
      let input = req.body;
      let userId = xss(input.userId);
      let petId = xss(input.petId);
      let imageUrl = xss(input.imageUrl);

      let data = await deletePres(userId, petId, imageUrl);
      res.status(200).send(data);
    } catch (e) {
      res.status(404).send({ error: e });
    }
  });

router
  .route("/:userid")
  .get(async (req, res) => {
    try {
      let userId = xss(req.params.userid);

      if (!ObjectId.isValid(userId)) throw badRequestError('Invalid object ID');

      let userData = await client.exists(userId);
      let data;

      if (userData) {
        data = await client.get(userId);
        data = JSON.parse(data);
      } else {
        data = await getAllPets(userId);
      }
      res.status(200).send(data);
    } catch (e) {
      res.status(404).send({ error: e });
    }
  })
  .post(async (req, res) => {
    try {
      let userId = xss(req.params.userid);

      let input = req.body;
      let petImage = xss(input.petImage);
      let petName = xss(input.petName);
      let petAge = xss(input.petAge);
      let petType = xss(input.petType);
      let petBreed = xss(input.petBreed);

      if (!ObjectId.isValid(userId)) throw badRequestError('Invalid object ID');

      if (!petName || !petAge || !petType || !petBreed || !Number(petAge)) {
        throw badRequestError('Invalid input');
      }

      let data = await createPet(
        userId,
        petImage,
        petName,
        petAge,
        petType,
        petBreed
      );
      res.status(200).send(data);
    } catch (e) {
      res.status(400).send({ error: e });
    }
  })
  .put(async (req, res) => {
    try {
      let userId = xss(req.params.userid);
      let input = req.body;
      let petId = xss(input.petId);
      let petName = xss(input.petName);
      let petAge = xss(input.petAge);
      let petType = xss(input.petType);
      let petBreed = xss(input.petBreed);
      let petImage = input.petImage !== undefined ? (input.petImage ? xss(input.petImage) : null) : undefined;

      if (!ObjectId.isValid(userId) || !ObjectId.isValid(petId)) throw badRequestError('Invalid object ID');

      if (!petName || !petAge || !petType || !petBreed || !Number(petAge)) {
        throw badRequestError('Invalid input');
      }

      let data = await updatePet(
        userId,
        petId,
        petName,
        petAge,
        petType,
        petBreed,
        petImage
      );
      res.status(200).send(data);
    } catch (e) {
      res.status(400).send({ error: e });
    }
  })
  .delete(async (req, res) => {
    try {
      let userId = xss(req.params.userid);
      let input = req.body;
      let petId = xss(input.petId);

      let data = await deletePet(userId, petId);
      res.status(200).send(data);
    } catch (e) {
      res.status(404).send({ error: e });
    }
  });

export default router;

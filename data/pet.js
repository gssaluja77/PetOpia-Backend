import { ObjectId } from "mongodb";
import { users } from "../config/mongoCollections.js";
import client from "../config/redisClient.js";
import { internalServerError, notFoundError } from "../helpers/wrappers.js";
import emailSender from "../helpers/reminderEmail.js";

const getAllPets = async (userId) => {
  const collection = await users();
  const user = await collection.findOne({ _id: new ObjectId(userId) });
  if (!user) {
    throw notFoundError("User Not Found!");
  }
  let data = user.pets;
  await client.set(userId, JSON.stringify(data));
  return data;
};

const getPet = async (userId, petId) => {
  const collection = await users();
  const user = await collection.findOne({ _id: new ObjectId(userId) });

  let data = user.pets;
  for (let i = 0; i < data.length; i++) {
    if (data[i]["_id"].toString() === petId) {
      data[i]["_id"] = data[i]["_id"].toString();
      return data[i];
    }
  }
  throw notFoundError("Pet Not Found!");
};

const createPet = async (
  userId,
  petImage,
  petName,
  petAge,
  petType,
  petBreed
) => {
  if (!ObjectId.isValid(userId)) throw badRequestError("Invalid object ID");

  if (!petName || !petAge || !petType || !petBreed || !Number(petAge)) {
    throw badRequestError("Invalid input");
  }

  const collection = await users();
  let newPet = {
    _id: new ObjectId(),
    petImage,
    petName,
    petAge,
    petType,
    petBreed,
    medications: [],
    appointments: [],
    prescription: [],
  };

  let insert = await collection.updateOne(
    { _id: new ObjectId(userId) },
    { $addToSet: { pets: newPet } }
  );
  if (insert.modifiedCount === 0)
    throw internalServerError("Pet could not be added!");
  return getAllPets(userId);
};

const updatePet = async (
  userId,
  petId,
  petName,
  petAge,
  petType,
  petBreed,
  petImage
) => {
  const collection = await users();

  let updateFields = {};
  if (petName) updateFields["pets.$.petName"] = petName;
  if (petAge) updateFields["pets.$.petAge"] = petAge;
  if (petType) updateFields["pets.$.petType"] = petType;
  if (petBreed) updateFields["pets.$.petBreed"] = petBreed;
  if (petImage !== undefined) updateFields["pets.$.petImage"] = petImage;

  if (Object.keys(updateFields).length === 0) {
    throw badRequestError("You haven't made any changes!");
  }

  if (!ObjectId.isValid(userId) || !ObjectId.isValid(petId))
    throw badRequestError("Invalid object ID");

  if (!petName || !petAge || !petType || !petBreed || !Number(petAge)) {
    throw badRequestError("Invalid input");
  }

  let update = await collection.updateOne(
    { _id: new ObjectId(userId), "pets._id": new ObjectId(petId) },
    { $set: updateFields }
  );

  if (update.modifiedCount === 0)
    throw badRequestError("You haven't made any changes!");

  const user = await collection.findOne({ _id: new ObjectId(userId) });
  await client.set(userId, JSON.stringify(user.pets));

  const updatedPet = user.pets.find((p) => p._id.toString() === petId);
  return updatedPet;
};

const deletePet = async (userId, petId) => {
  const collection = await users();

  const update = await collection.updateOne(
    { _id: new ObjectId(userId) },
    { $pull: { pets: { _id: new ObjectId(petId) } } }
  );

  if (update.modifiedCount === 0)
    throw internalServerError("Could not delete pet successfully");

  return await getAllPets(userId);
};

const createMed = async (
  userId,
  petId,
  medicationName,
  administeredDate,
  dosage
) => {
  const collection = await users();

  const newMed = {
    _id: new ObjectId(),
    medicationName,
    administeredDate,
    dosage,
  };

  const update = await collection.updateOne(
    { _id: new ObjectId(userId), "pets._id": new ObjectId(petId) },
    { $push: { "pets.$.medications": newMed } }
  );

  if (update.modifiedCount === 0)
    throw internalServerError("Medication could not be added!");

  const user = await collection.findOne({ _id: new ObjectId(userId) });
  await client.set(userId, JSON.stringify(user.pets));

  const updatedPet = user.pets.find((p) => p._id.toString() === petId);
  return updatedPet;
};

const deleteMed = async (userId, petId, medId) => {
  const collection = await users();

  const update = await collection.updateOne(
    { _id: new ObjectId(userId), "pets._id": new ObjectId(petId) },
    { $pull: { "pets.$.medications": { _id: new ObjectId(medId) } } }
  );

  if (update.modifiedCount === 0)
    throw internalServerError("Medication could not be deleted!");

  const user = await collection.findOne({ _id: new ObjectId(userId) });
  await client.set(userId, JSON.stringify(user.pets));

  const updatedPet = user.pets.find((p) => p._id.toString() === petId);
  return updatedPet;
};

const createApp = async (
  userId,
  petId,
  appointmentDate,
  reason,
  clinicName
) => {
  const collection = await users();

  const newApp = {
    _id: new ObjectId(),
    appointmentDate,
    reason,
    clinicName,
  };

  const update = await collection.updateOne(
    { _id: new ObjectId(userId), "pets._id": new ObjectId(petId) },
    { $push: { "pets.$.appointments": newApp } }
  );

  if (update.modifiedCount === 0)
    throw internalServerError("Appointment could not be added!");

  const user = await collection.findOne({ _id: new ObjectId(userId) });
  await client.set(userId, JSON.stringify(user.pets));

  const updatedPet = user.pets.find((p) => p._id.toString() === petId);
  return updatedPet;
};

const deleteApp = async (userId, petId, appId) => {
  const collection = await users();

  const update = await collection.updateOne(
    { _id: new ObjectId(userId), "pets._id": new ObjectId(petId) },
    { $pull: { "pets.$.appointments": { _id: new ObjectId(appId) } } }
  );

  if (update.modifiedCount === 0)
    throw internalServerError("Appointment could not be deleted!");

  const user = await collection.findOne({ _id: new ObjectId(userId) });
  await client.set(userId, JSON.stringify(user.pets));

  const updatedPet = user.pets.find((p) => p._id.toString() === petId);
  return updatedPet;
};

const createPres = async (userId, petId, imageUrl) => {
  const collection = await users();

  const update = await collection.updateOne(
    { _id: new ObjectId(userId), "pets._id": new ObjectId(petId) },
    { $push: { "pets.$.prescription": imageUrl } }
  );

  if (update.modifiedCount === 0)
    throw internalServerError("Prescription could not be added!");

  const user = await collection.findOne({ _id: new ObjectId(userId) });
  await client.set(userId, JSON.stringify(user.pets));

  const updatedPet = user.pets.find((p) => p._id.toString() === petId);
  return updatedPet;
};

const deletePres = async (userId, petId, imageUrl) => {
  const collection = await users();

  const update = await collection.updateOne(
    { _id: new ObjectId(userId), "pets._id": new ObjectId(petId) },
    { $pull: { "pets.$.prescription": imageUrl } }
  );

  if (update.modifiedCount === 0)
    throw internalServerError("Prescription could not be deleted!");

  const user = await collection.findOne({ _id: new ObjectId(userId) });
  await client.set(userId, JSON.stringify(user.pets));

  const updatedPet = user.pets.find((p) => p._id.toString() === petId);
  return updatedPet;
};

const appointmentReminder = async () => {
  const userCollection = await users();
  const cursor = userCollection.find({});

  for await (const user of cursor) {
    if (!user.pets.length) continue;

    for (const pet of user.pets) {
      if (!pet.appointments) continue;

      for (const appointment of pet.appointments) {
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + 1);

        const year = reminderDate.getFullYear();
        const month = String(reminderDate.getMonth() + 1).padStart(2, "0");
        const day = String(reminderDate.getDate()).padStart(2, "0");
        const convertedDate = `${year}-${month}-${day}`;

        if (appointment.appointmentDate === convertedDate) {
          const userEmail = user.email.toString();
          const petName = pet.petName.toString();
          const html = `<p>Dear ${user.firstName},</p>
                        <p>This is a friendly reminder that you have an appointment for your pet, ${pet.petName}, scheduled for tomorrow (${appointment.appointmentDate}) at ${appointment.clinicName} regarding ${appointment.reason}.</p>
                        <br />
                        <p>Best regards,<br/>The PetOpia Team</p>`;

          await emailSender(userEmail, "Appointment", petName, html);
        }
      }
    }
  }
};

export {
  getAllPets,
  createPet,
  getPet,
  updatePet,
  deletePet,
  createMed,
  deleteMed,
  createApp,
  deleteApp,
  createPres,
  deletePres,
  appointmentReminder,
};

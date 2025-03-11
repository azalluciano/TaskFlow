"use server";

import prisma from "@/lib/lib";
import { randomBytes } from "crypto";

export async function checkAndAddUser(email: string, name: string) {
  if (!email) return;
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });
    if (!existingUser && name) {
      await prisma.user.create({
        data: {
          email: email,
          name: name,
        },
      });
      console.error("Erreur lors de la verification de l'utilisateur");
    } else {
      console.error("Utilisateur déjà présent dans la base de données");
    }
  } catch (error) {
    console.error("Erreur lors de la verification de l'utilisateur", error);
  }
}

function generateUniqueCode(): string {
  return randomBytes(6).toString("hex");
}

export async function createProject(
  name: string,
  description: string,
  email: string
) {
  if (!name || !description || !email) return;
  try {
    const inviteCode = generateUniqueCode();
    const user = await prisma.user.findUnique({
      where: { email: email },
    });
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    const newProject = await prisma.project.create({
      data: { name, description, inviteCode, createdById: user.id },
    });

    return newProject;
  } catch (error) {
    console.error(error);
    throw new Error();
  }
}
export async function getProjectsCreatedByUser(email: string) {
  if (!email) return;
  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
    });
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }
    const projects = await prisma.project.findMany({
      where: { createdById: user.id },
      include: {
        tasks: {
          include: {
            user: true,
            createdBy: true,
          },
        },
        users: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    const formatedProjects = projects.map((project) => ({
      ...project,
      users: project.users.map((userEntry) => userEntry.user),
    }));
    return formatedProjects;
  } catch (error) {
    console.error(error);
    throw new Error();
  }
}

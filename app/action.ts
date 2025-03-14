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

export async function deleteProjectsById(projectId: string) {
  if (!projectId) return;
  try {
    await prisma.project.delete({
      where: { id: projectId },
    });
    console.log("Projet supprimé avec succès");
  } catch (error) {
    console.error(error);
    throw new Error();
  }
}

export async function addUserToProject(email: string, inviteCode: string) {
  if (!email || !inviteCode) return;
  try {
    const project = await prisma.project.findUnique({
      where: { inviteCode: inviteCode },
    });
    if (!project) {
      throw new Error("Projet non trouvé");
    }
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }
    const existingAssociation = await prisma.projectUser.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId: project.id,
        },
      },
    });
    if (existingAssociation) {
      throw new Error("Utilisateur déjà ajouté au projet");
    }
    await prisma.projectUser.create({
      data: {
        userId: user.id,
        projectId: project.id,
      },
    });

    console.log("Utilisateur ajouté avec succès");
  } catch (error) {
    console.error(error);
    throw new Error();
  }
}

export async function getProjectAssociatedWithUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
    });
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }
    const projects = await prisma.project.findMany({
      where: {
        users: {
          some: {
            user: {
              email,
            },
          },
        },
      },
      include: {
        tasks: true,
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

export async function getProjectInfo(
  idProject: string,
  details: boolean = false
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: idProject },
      include: details
        ? {
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
            createdBy: true,
          }
        : undefined,
    });
    if (!project) {
      throw new Error("Projet non trouvé");
    }
    return project;
  } catch (error) {
    console.error(error);
    throw new Error();
  }
}

export async function getProjectUsers(idProject: string) {
  try {
    const projectWithUsers = await prisma.project.findUnique({
      where: {
        id: idProject,
      },
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
    });
    const users =
      projectWithUsers?.users.map((projectUser) => projectUser.user) || [];
    return users;
  } catch (error) {
    console.error(error);
    throw new Error();
  }
}

export async function createTask(
  name: string,
  description: string,
  dueDate: Date | null,
  projectId: string,
  createdByEmail: string,
  assignToEmail: string | undefined
) {
  try {
    const createdBy = await prisma.user.findUnique({
      where: { email: createdByEmail },
    });

    if (!createdBy) {
      throw new Error(`Utilisateur avec l'email ${createdByEmail} introuvable`);
    }

    let assignedUserId = createdBy.id;

    if (assignToEmail) {
      const assignedUser = await prisma.user.findUnique({
        where: { email: assignToEmail },
      });
      if (!assignedUser) {
        throw new Error(
          `Utilisateur avec l'email ${assignToEmail} introuvable`
        );
      }
      assignedUserId = assignedUser.id;
    }

    const newTask = await prisma.task.create({
      data: {
        name,
        description,
        dueDate,
        projectId,
        createdById: createdBy.id,
        userId: assignedUserId,
      },
    });

    console.log("Tâche créée avec succès:", newTask);
    return newTask;
  } catch (error) {
    console.error(error);
    throw new Error();
  }
}

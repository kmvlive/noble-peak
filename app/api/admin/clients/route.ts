import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getAllClients,
  getClientByEmail,
  updateClient,
  deleteClient,
} from "@/lib/models";
import { mockClients } from "@/lib/mock-data";
import { verifyToken } from "@/lib/auth";

const updateClientSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(20).optional(),
});

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = request.cookies.get("admin_token");
  return cookie?.value ?? null;
}

export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const clients = await getAllClients();
      const safeClients = clients.map((c) => ({
        email: c.email,
        name: c.name,
        phone: c.phone,
        createdAt: c.createdAt,
      }));
      return NextResponse.json(safeClients);
    } catch (error) {
      console.error("Ошибка получения клиентов:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  const safeMockClients = mockClients.map((c) => ({
    email: c.email,
    name: c.name,
    phone: c.phone,
    createdAt: c.createdAt,
  }));
  return NextResponse.json(safeMockClients);
}

export async function PUT(request: NextRequest) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = updateClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await getClientByEmail(parsed.data.email);
    if (!existing) {
      return NextResponse.json({ error: "Клиент не найден" }, { status: 404 });
    }

    const updateData: { name?: string; phone?: string } = {};
    if (parsed.data.name !== undefined) {
      updateData.name = parsed.data.name;
    }
    if (parsed.data.phone !== undefined) {
      updateData.phone = parsed.data.phone;
    }

    const client = await updateClient(parsed.data.email, updateData);
    return NextResponse.json({
      email: client.email,
      name: client.name,
      phone: client.phone,
      createdAt: client.createdAt,
    });
  } catch (error) {
    console.error("Ошибка обновления клиента:", error);
    return NextResponse.json(
      { error: "Ошибка обновления клиента" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email обязателен" }, { status: 400 });
    }

    const existing = await getClientByEmail(email);
    if (!existing) {
      return NextResponse.json({ error: "Клиент не найден" }, { status: 404 });
    }

    await deleteClient(email);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления клиента:", error);
    return NextResponse.json(
      { error: "Ошибка удаления клиента" },
      { status: 500 }
    );
  }
}

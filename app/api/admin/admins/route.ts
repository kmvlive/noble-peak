import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getAllAdmins,
  getAdminByEmail,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from "@/lib/models";
import { mockAdmins } from "@/lib/mock-data";
import { verifyToken, isMainAdminEmail } from "@/lib/auth";

const createAdminSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(4).max(200),
  name: z.string().min(1).max(200),
});

const updateAdminSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(4).max(200).optional(),
  name: z.string().min(1).max(200).optional(),
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

  if (!isMainAdminEmail(payload.email)) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const admins = await getAllAdmins();
      const safeAdmins = admins.map((a) => ({
        email: a.email,
        name: a.name,
        role: a.role,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      }));
      return NextResponse.json(safeAdmins);
    } catch (error) {
      console.error("Ошибка получения администраторов:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из DynamoDB" },
        { status: 500 }
      );
    }
  }

  const safeMockAdmins = mockAdmins.map((a) => ({
    email: a.email,
    name: a.name,
    role: a.role,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));
  return NextResponse.json(safeMockAdmins);
}

export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  if (!isMainAdminEmail(payload.email)) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
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
    const parsed = createAdminSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await getAdminByEmail(parsed.data.email);
    if (existing) {
      return NextResponse.json(
        { error: "Администратор с таким email уже существует" },
        { status: 409 }
      );
    }

    const admin = await createAdmin({
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name,
      role: "admin",
    });

    const safeAdmin = {
      email: admin.email,
      name: admin.name,
      role: admin.role,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
    return NextResponse.json(safeAdmin, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания администратора:", error);
    return NextResponse.json(
      { error: "Ошибка создания администратора" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  if (!isMainAdminEmail(payload.email)) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
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
    const parsed = updateAdminSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await getAdminByEmail(parsed.data.email);
    if (!existing) {
      return NextResponse.json(
        { error: "Администратор не найден" },
        { status: 404 }
      );
    }

    const updateData: { password?: string; name?: string } = {};
    if (parsed.data.password !== undefined) {
      updateData.password = parsed.data.password;
    }
    if (parsed.data.name !== undefined) {
      updateData.name = parsed.data.name;
    }

    const admin = await updateAdmin(parsed.data.email, updateData);
    const safeAdmin = {
      email: admin.email,
      name: admin.name,
      role: admin.role,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
    return NextResponse.json(safeAdmin);
  } catch (error) {
    console.error("Ошибка обновления администратора:", error);
    return NextResponse.json(
      { error: "Ошибка обновления администратора" },
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

  if (!isMainAdminEmail(payload.email)) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
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

    const existing = await getAdminByEmail(email);
    if (!existing) {
      return NextResponse.json(
        { error: "Администратор не найден" },
        { status: 404 }
      );
    }

    await deleteAdmin(email);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления администратора:", error);
    return NextResponse.json(
      { error: "Ошибка удаления администратора" },
      { status: 500 }
    );
  }
}

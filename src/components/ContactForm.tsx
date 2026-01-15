import { useState } from "react";
import { User, Mail, Save, Edit2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Contact {
  name: string;
  email: string;
}

interface ContactFormProps {
  contact: Contact;
  onSave: (contact: Contact) => void;
}

export function ContactForm({ contact, onSave }: ContactFormProps) {
  const [isEditing, setIsEditing] = useState(!contact.name && !contact.email);
  const [name, setName] = useState(contact.name);
  const [email, setEmail] = useState(contact.email);

  const handleSave = () => {
    if (name.trim() && email.trim()) {
      onSave({ name: name.trim(), email: email.trim() });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setName(contact.name);
    setEmail(contact.email);
    setIsEditing(false);
  };

  return (
    <Card className="shadow-card w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            紧急联系人
          </span>
          {!isEditing && contact.name && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8 px-2"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">姓名</Label>
              <Input
                id="name"
                placeholder="联系人姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="联系人邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1 gap-2">
                <Save className="w-4 h-4" />
                保存
              </Button>
              {contact.name && (
                <Button variant="outline" onClick={handleCancel} className="gap-2">
                  <X className="w-4 h-4" />
                  取消
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{contact.name}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{contact.email}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              如果您连续2天未签到，系统将自动通知此联系人
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

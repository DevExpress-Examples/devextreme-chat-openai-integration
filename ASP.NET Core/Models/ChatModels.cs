using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json.Serialization;

namespace ASP_NET_Core.Models {
    public class ChatUser
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("avatarUrl")]
        public string AvatarUrl { get; set; }
    }
    public class Message
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; }

        [JsonPropertyName("author")]
        public ChatUser Author { get; set; }

        [JsonPropertyName("text")]
        public string Text { get; set; }

        [JsonPropertyName("isDeleted")]
        public Boolean IsDeleted { get; set; }

        [JsonPropertyName("isEdited")]
        public Boolean IsEdited { get; set; }
    }
    public class ChatViewModel
    {
        public IEnumerable<Message> Messages { get; set; }
        public ChatUser CurrentUser { get; set; }
        public ChatUser SupportAgent { get; set; }
    }
}

using Microsoft.AspNetCore.Identity;

namespace GymTrack.Infrastructure.Identity;

public class ApplicationUser : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;
    public ICollection<IdentityUserToken<Guid>> Tokens { get; set; } = new List<IdentityUserToken<Guid>>();
}
